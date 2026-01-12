import { noTarget, isOfMetaType, isActiveFeature, isInactiveFeature, isShiftDown } from '../lib/common_selectors.js';
import createSupplementaryPoints from '../lib/create_supplementary_points.js';
import constrainFeatureMovement from '../lib/constrain_feature_movement.js';
import doubleClickZoom from '../lib/double_click_zoom.js';
import * as Constants from '../constants.js';
import moveFeatures from '../lib/move_features.js';
import { showMovementVector, removeMovementVector, showAdjacentSegmentLengths, removeAdjacentSegmentLengths } from '../lib/movement_vector.js';
import { findClickedEdge, determineRailDirection, constrainToRail, showRailLine, removeRailLine, showRailIndicator, removeRailIndicator } from '../lib/rail_constraint.js';
import {
  showRightAngleIndicator,
  removeRightAngleIndicator,
  showCollinearSnapLine,
  removeCollinearSnapLine,
  showParallelLineIndicator,
  removeParallelLineIndicator,
  removeAllSnapIndicators
} from '../lib/snap_indicators.js';
import {
  findNearestSegment,
  findNearbyParallelLines,
  getParallelBearing,
  calculatePerpendicularToLine,
  calculateCircleLineIntersection,
  calculateLineIntersection,
  findExtendedGuidelineIntersection,
  getExtendedGuidelineBearings,
  getPerpendicularToGuidelineBearing,
  getAdjacentSegmentsAtVertex,
  calculatePixelDistanceToExtendedGuidelines,
  resolveSnapConflicts
} from '../lib/distance_mode_helpers.js';
import {
  createDistanceInput as createDistanceInputUI,
  createAngleInput as createAngleInputUI,
  showDistanceAngleUI,
  hideDistanceAngleUI,
  removeDistanceAngleUI
} from '../lib/angle_distance_input.js';
import * as turf from '@turf/turf';

const isVertex = isOfMetaType(Constants.meta.VERTEX);
const isMidpoint = isOfMetaType(Constants.meta.MIDPOINT);

/**
 * Get the bearings of segments adjacent to a vertex
 * Returns an array of {bearing, segment} objects for snapping reference
 */
function getAdjacentSegmentBearings(feature, coordPath) {
  const geojson = feature.toGeoJSON();
  const geom = geojson.geometry;

  let coordinates = [];
  if (geom.type === 'LineString') {
    coordinates = geom.coordinates;
  } else if (geom.type === 'Polygon') {
    coordinates = geom.coordinates[0]; // Outer ring
  } else {
    return [];
  }

  // Parse coord path to get index
  const pathParts = coordPath.split('.');
  const vertexIndex = parseInt(pathParts[pathParts.length - 1], 10);

  if (isNaN(vertexIndex) || vertexIndex < 0 || vertexIndex >= coordinates.length) {
    return [];
  }

  const segments = [];
  const vertex = coordinates[vertexIndex];

  // Previous segment (from previous vertex to this vertex)
  if (vertexIndex > 0) {
    const prevVertex = coordinates[vertexIndex - 1];
    const bearing = turf.bearing(turf.point(prevVertex), turf.point(vertex));
    segments.push({
      bearing: bearing,
      segment: { start: prevVertex, end: vertex },
      type: 'previous'
    });
  } else if (geom.type === 'Polygon' && coordinates.length > 2) {
    // For polygon first vertex, wrap to last segment
    const lastVertex = coordinates[coordinates.length - 2]; // -2 because polygon closes
    const bearing = turf.bearing(turf.point(lastVertex), turf.point(vertex));
    segments.push({
      bearing: bearing,
      segment: { start: lastVertex, end: vertex },
      type: 'previous'
    });
  }

  // Next segment (from this vertex to next vertex)
  if (vertexIndex < coordinates.length - 1) {
    const nextVertex = coordinates[vertexIndex + 1];
    const bearing = turf.bearing(turf.point(vertex), turf.point(nextVertex));
    segments.push({
      bearing: bearing,
      segment: { start: vertex, end: nextVertex },
      type: 'next'
    });
  } else if (geom.type === 'Polygon' && coordinates.length > 2) {
    // For polygon last vertex, wrap to first segment
    const firstVertex = coordinates[1]; // Skip closing vertex
    const bearing = turf.bearing(turf.point(vertex), turf.point(firstVertex));
    segments.push({
      bearing: bearing,
      segment: { start: vertex, end: firstVertex },
      type: 'next'
    });
  }

  return segments;
}

/**
 * Check if mouse bearing is orthogonal to any adjacent segment
 * Returns the best matching orthogonal bearing or null
 */
function getOrthogonalSnapBearing(adjacentSegments, mouseBearing, tolerance) {
  if (!adjacentSegments || adjacentSegments.length === 0) {
    return null;
  }

  const orthogonalAngles = [0, 90, 180, 270];
  let bestMatch = null;
  let bestDiff = Infinity;
  const normalizedMouse = ((mouseBearing % 360) + 360) % 360;

  for (const segmentInfo of adjacentSegments) {
    for (const angle of orthogonalAngles) {
      const orthogonalBearing = segmentInfo.bearing + angle;
      const normalizedOrthogonal = ((orthogonalBearing % 360) + 360) % 360;

      let diff = Math.abs(normalizedOrthogonal - normalizedMouse);
      if (diff > 180) diff = 360 - diff;

      if (diff <= tolerance && diff < bestDiff) {
        bestDiff = diff;
        bestMatch = {
          bearing: orthogonalBearing,
          referenceBearing: segmentInfo.bearing,
          referenceSegment: segmentInfo.segment,
          angleFromReference: angle
        };
      }
    }
  }

  return bestMatch;
}

const DirectSelect = {};

/**
 * Create the distance input UI for vertex editing
 */
DirectSelect.createDistanceInput = function(state) {
  createDistanceInputUI(this._ctx, state, {
    shouldActivateKeyHandler: () => true,
    initiallyHidden: true,
    forceCreate: true
  });
};

/**
 * Create the angle input UI for vertex editing
 */
DirectSelect.createAngleInput = function(state) {
  createAngleInputUI(this._ctx, state, {
    shouldActivateKeyHandler: () => true,
    forceCreate: true
  });
};

/**
 * Show the distance/angle input UI
 */
DirectSelect.showDistanceAngleUI = function(state) {
  showDistanceAngleUI(state);
};

/**
 * Hide the distance/angle input UI
 */
DirectSelect.hideDistanceAngleUI = function(state) {
  hideDistanceAngleUI(state);
};

/**
 * Remove the distance/angle input UI elements
 */
DirectSelect.removeDistanceAngleUI = function(state) {
  removeDistanceAngleUI(state);
};

/**
 * Detect if the mouse is hovering over an intersection point (snappingPoint)
 * Returns intersection info if found, null otherwise
 */
DirectSelect.detectHoveredIntersectionPoint = function(state, e) {
  const map = this.map;
  if (!map || !this._ctx.snapping) return null;

  // Query features at the hover point from snap buffer layers
  const bufferLayers = this._ctx.snapping.bufferLayers.map(
    (layerId) => '_snap_buffer_' + layerId
  );
  const featuresAtPoint = map.queryRenderedFeatures(e.point, {
    layers: bufferLayers,
  });

  // Look for a midpoint feature FIRST (point with isMidpoint === true)
  const midpoint = featuresAtPoint.find((feature) => {
    return (
      feature.properties &&
      feature.properties.type === 'snappingPoint' &&
      feature.properties.isMidpoint === true &&
      feature.properties.guidelineIds
    );
  });

  if (midpoint) {
    return {
      coord: midpoint.geometry.coordinates,
      feature: midpoint,
      guidelineIds: JSON.parse(midpoint.properties.guidelineIds),
      type: 'midpoint',
    };
  }

  // Look for an intersection point (snappingPoint with multiple guidelines, NOT a midpoint)
  const intersectionPoint = featuresAtPoint.find((feature) => {
    return (
      feature.properties &&
      feature.properties.type === 'snappingPoint' &&
      feature.properties.guidelineIds &&
      feature.properties.isMidpoint !== true
    );
  });

  if (intersectionPoint) {
    return {
      coord: intersectionPoint.geometry.coordinates,
      guidelineIds: JSON.parse(intersectionPoint.properties.guidelineIds),
      feature: intersectionPoint,
      type: 'intersection'
    };
  }

  return null;
};

/**
 * Get snap information for a given position.
 * Returns structured snap info similar to DrawLineStringDistance.getSnapInfo()
 * @param {Object} lngLat - Position to check for snapping {lng, lat}
 * @returns {Object|null} Snap info with type ('point' or 'line'), coord, bearing, segment, snappedFeature
 */
DirectSelect.getSnapInfo = function(lngLat) {
  const snapping = this._ctx.snapping;
  if (!snapping || !snapping.snappedGeometry) {
    return null;
  }

  const geom = snapping.snappedGeometry;
  const snapCoord = snapping.snapCoord(lngLat);

  // Check if actually snapped
  const didSnap = snapCoord.lng !== lngLat.lng || snapCoord.lat !== lngLat.lat;
  if (!didSnap) {
    return null;
  }

  // Point snap
  if (geom.type === 'Point') {
    return {
      type: 'point',
      coord: [snapCoord.lng, snapCoord.lat],
      snappedFeature: snapping.snappedFeature
    };
  }

  // Line snap (LineString or MultiLineString)
  if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
    const snapPoint = turf.point([snapCoord.lng, snapCoord.lat]);
    const coords = geom.type === 'LineString' ? geom.coordinates : geom.coordinates.flat();

    const result = findNearestSegment(coords, snapPoint);
    if (result) {
      const bearing = turf.bearing(
        turf.point(result.segment.start),
        turf.point(result.segment.end)
      );
      return {
        type: 'line',
        coord: [snapCoord.lng, snapCoord.lat],
        bearing: bearing,
        segment: result.segment,
        snappedFeature: snapping.snappedFeature
      };
    }
  }

  return null;
};

/**
 * Extend guidelines from an intersection or midpoint
 * Returns array of extended line features
 */
DirectSelect.extendGuidelines = function(state, intersectionInfo) {
  const map = this.map;
  if (!map) return [];

  const extendedLines = [];

  // Handle midpoint type - create perpendicular guideline
  if (intersectionInfo.type === 'midpoint') {
    const { coord, guidelineIds } = intersectionInfo;

    // Get the parent line from the guideline ID
    const guidelineId = guidelineIds[0]; // Midpoints have only one parent guideline
    const sourceId = intersectionInfo.feature.source;
    const source = map.getSource(sourceId);
    if (!source) return [];

    // Get all features from the source
    const allFeatures = map.querySourceFeatures(sourceId, {
      sourceLayer: intersectionInfo.feature.sourceLayer,
    });

    const guidelineFeature = allFeatures.find((f) => f.id === guidelineId);
    if (!guidelineFeature) return [];

    const geometry = guidelineFeature.geometry;
    let lineBearing;

    // Calculate the bearing of the line segment containing the midpoint
    if (geometry.type === 'LineString') {
      const coords = geometry.coordinates;
      if (coords.length < 2) return [];

      // Find the segment that contains this midpoint
      let segmentBearing;
      const coordPoint = turf.point(coord);
      for (let i = 0; i < coords.length - 1; i++) {
        const start = coords[i];
        const end = coords[i + 1];
        const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];

        const dist = turf.distance(turf.point(mid), coordPoint, { units: 'meters' });
        if (dist < 1) {
          segmentBearing = turf.bearing(turf.point(start), turf.point(end));
          break;
        }
      }

      if (segmentBearing === undefined) {
        segmentBearing = turf.bearing(
          turf.point(coords[0]),
          turf.point(coords[coords.length - 1])
        );
      }

      lineBearing = segmentBearing;
    } else if (geometry.type === 'MultiLineString') {
      let segmentBearing;
      const coordPoint = turf.point(coord);
      for (const lineCoords of geometry.coordinates) {
        if (lineCoords.length < 2) continue;

        for (let i = 0; i < lineCoords.length - 1; i++) {
          const start = lineCoords[i];
          const end = lineCoords[i + 1];
          const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];

          const dist = turf.distance(turf.point(mid), coordPoint, { units: 'meters' });
          if (dist < 1) {
            segmentBearing = turf.bearing(turf.point(start), turf.point(end));
            break;
          }
        }
        if (segmentBearing !== undefined) break;
      }

      if (segmentBearing === undefined) return [];
      lineBearing = segmentBearing;
    } else {
      return [];
    }

    // Create perpendicular line (90 degrees to the original line)
    const perpendicularBearing = lineBearing + 90;
    const extensionDistance = this._ctx.options.extendedGuidelineDistance || 0.2;

    const extendedStart = turf.destination(
      turf.point(coord),
      extensionDistance,
      perpendicularBearing + 180,
      { units: 'kilometers' }
    );
    const extendedEnd = turf.destination(
      turf.point(coord),
      extensionDistance,
      perpendicularBearing,
      { units: 'kilometers' }
    );

    extendedLines.push({
      type: 'Feature',
      properties: { isExtendedGuideline: true, isMidpointGuideline: true },
      geometry: {
        type: 'LineString',
        coordinates: [
          extendedStart.geometry.coordinates,
          coord,
          extendedEnd.geometry.coordinates,
        ],
      },
    });

    return extendedLines;
  }

  // Handle intersection type - extend the original guidelines
  const { coord, guidelineIds } = intersectionInfo;

  // Query source features once and cache for all guidelines
  const sourceId = intersectionInfo.feature.source;
  const source = map.getSource(sourceId);
  if (!source) return [];

  const allFeatures = map.querySourceFeatures(sourceId, {
    sourceLayer: intersectionInfo.feature.sourceLayer,
  });

  // For each guideline ID, find and extend it
  for (const guidelineId of guidelineIds) {
    const guidelineFeature = allFeatures.find((f) => f.id === guidelineId);
    if (!guidelineFeature) continue;

    let geometry = guidelineFeature.geometry;

    if (geometry.type === 'LineString') {
      const coords = geometry.coordinates;
      if (coords.length < 2) continue;

      const bearing = turf.bearing(
        turf.point(coords[0]),
        turf.point(coords[coords.length - 1])
      );

      const extensionDistance = this._ctx.options.extendedGuidelineDistance || 0.2;
      const extendedStart = turf.destination(
        turf.point(coords[0]),
        extensionDistance,
        bearing + 180,
        { units: 'kilometers' }
      );
      const extendedEnd = turf.destination(
        turf.point(coords[coords.length - 1]),
        extensionDistance,
        bearing,
        { units: 'kilometers' }
      );

      extendedLines.push({
        type: 'Feature',
        properties: { isExtendedGuideline: true },
        geometry: {
          type: 'LineString',
          coordinates: [
            extendedStart.geometry.coordinates,
            ...coords,
            extendedEnd.geometry.coordinates,
          ],
        },
      });
    } else if (geometry.type === 'MultiLineString') {
      for (const lineCoords of geometry.coordinates) {
        if (lineCoords.length < 2) continue;

        const bearing = turf.bearing(
          turf.point(lineCoords[0]),
          turf.point(lineCoords[lineCoords.length - 1])
        );

        const extensionDistance = this._ctx.options.extendedGuidelineDistance || 0.2;
        const extendedStart = turf.destination(
          turf.point(lineCoords[0]),
          extensionDistance,
          bearing + 180,
          { units: 'kilometers' }
        );
        const extendedEnd = turf.destination(
          turf.point(lineCoords[lineCoords.length - 1]),
          extensionDistance,
          bearing,
          { units: 'kilometers' }
        );

        extendedLines.push({
          type: 'Feature',
          properties: { isExtendedGuideline: true },
          geometry: {
            type: 'LineString',
            coordinates: [
              extendedStart.geometry.coordinates,
              ...lineCoords,
              extendedEnd.geometry.coordinates,
            ],
          },
        });
      }
    }
  }

  return extendedLines;
};

/**
 * Render extended guidelines on the map
 */
DirectSelect.renderExtendedGuidelines = function(state, extendedLines) {
  const map = this.map;
  if (!map) return;

  const featureCollection = {
    type: 'FeatureCollection',
    features: extendedLines,
  };

  // Create or update the visual layer for extended guidelines
  if (!map.getSource('extended-guidelines')) {
    map.addSource('extended-guidelines', {
      type: 'geojson',
      data: featureCollection,
    });

    map.addLayer({
      id: 'extended-guidelines',
      type: 'line',
      source: 'extended-guidelines',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 0.3,
        'line-dasharray': [4, 4],
      },
    });
  } else {
    map.getSource('extended-guidelines').setData(featureCollection);
  }

  // Create or update the snap buffer layer for extended guidelines
  const bufferLayerId = '_snap_buffer_extended-guidelines';
  const snapDistance = this._ctx.options.snapDistance || 15;

  if (!map.getLayer(bufferLayerId)) {
    map.addLayer({
      id: bufferLayerId,
      type: 'line',
      source: 'extended-guidelines',
      paint: {
        'line-color': 'hsla(0,100%,50%,0.001)',
        'line-width': snapDistance * 2,
      },
    });

    // Add mouseover handler to enable snapping
    const mouseoverHandler = (e) => {
      if (e.features && e.features.length > 0) {
        // Clear snap-hover state from previous snapped feature before switching
        if (this._ctx.snapping.snappedFeature &&
            this._ctx.snapping.snappedFeature.id !== undefined &&
            !(this._ctx.snapping.snappedFeature.properties &&
              this._ctx.snapping.snappedFeature.properties.isExtendedGuideline)) {
          this._ctx.snapping.setSnapHoverState(this._ctx.snapping.snappedFeature, false);
        }
        const feature = e.features[0];
        this._ctx.snapping.snappedGeometry = feature.geometry;
        this._ctx.snapping.snappedFeature = feature;
        state.isHoveringExtendedGuidelines = true;
      }
    };

    const mouseoutHandler = () => {
      state.isHoveringExtendedGuidelines = false;
      if (
        this._ctx.snapping.snappedGeometry &&
        this._ctx.snapping.snappedFeature &&
        this._ctx.snapping.snappedFeature.properties &&
        this._ctx.snapping.snappedFeature.properties.isExtendedGuideline
      ) {
        this._ctx.snapping.snappedGeometry = undefined;
        this._ctx.snapping.snappedFeature = undefined;
      }
    };

    state.extendedGuidelineMouseoverHandler = mouseoverHandler;
    state.extendedGuidelineMouseoutHandler = mouseoutHandler;

    map.on('mousemove', bufferLayerId, mouseoverHandler);
    map.on('mouseout', bufferLayerId, mouseoutHandler);
  }
};

/**
 * Update the guide circle showing distance constraint
 */
DirectSelect.updateGuideCircle = function(state, center, radius) {
  // Check if we can reuse the existing circle (optimization)
  if (
    state.guideCircle &&
    state.guideCircleRadius === radius &&
    state.guideCircleCenter &&
    state.guideCircleCenter[0] === center[0] &&
    state.guideCircleCenter[1] === center[1]
  ) {
    return; // No need to regenerate
  }

  const steps = 64;
  const circleCoords = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 360;
    const pt = turf.destination(turf.point(center), radius / 1000, angle, {
      units: 'kilometers',
    });
    circleCoords.push(pt.geometry.coordinates);
  }

  const circleFeature = {
    type: 'Feature',
    properties: { isGuideCircle: true },
    geometry: {
      type: 'LineString',
      coordinates: circleCoords,
    },
  };

  state.guideCircle = circleFeature;
  state.guideCircleRadius = radius;
  state.guideCircleCenter = center;

  const map = this.map;
  if (!map) return;

  if (!map.getSource('distance-guide-circle')) {
    map.addSource('distance-guide-circle', {
      type: 'geojson',
      data: circleFeature,
    });

    map.addLayer({
      id: 'distance-guide-circle',
      type: 'line',
      source: 'distance-guide-circle',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 0.2,
        'line-dasharray': [2, 2],
      },
    });
  } else {
    map.getSource('distance-guide-circle').setData(circleFeature);
  }
};

/**
 * Remove the guide circle
 */
DirectSelect.removeGuideCircle = function(state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('distance-guide-circle')) {
    map.removeLayer('distance-guide-circle');
  }
  if (map.getSource && map.getSource('distance-guide-circle')) {
    map.removeSource('distance-guide-circle');
  }
  state.guideCircle = null;
  state.guideCircleRadius = null;
  state.guideCircleCenter = null;
};

/**
 * Remove extended guidelines from the map
 */
DirectSelect.removeExtendedGuidelines = function(state) {
  const map = this.map;
  if (!map) return;

  const bufferLayerId = '_snap_buffer_extended-guidelines';

  // Remove event handlers
  if (state.extendedGuidelineMouseoverHandler) {
    map.off('mousemove', bufferLayerId, state.extendedGuidelineMouseoverHandler);
    state.extendedGuidelineMouseoverHandler = null;
  }
  if (state.extendedGuidelineMouseoutHandler) {
    map.off('mouseout', bufferLayerId, state.extendedGuidelineMouseoutHandler);
    state.extendedGuidelineMouseoutHandler = null;
  }

  // Clear snap-hover state from the intersection point
  if (state.hoveredIntersectionPoint && this._ctx.snapping) {
    const feature = state.hoveredIntersectionPoint.feature;
    if (feature && feature.id !== undefined) {
      this._ctx.snapping.setSnapHoverState(feature, false);
    }
  }

  // Remove buffer layer
  if (map.getLayer && map.getLayer(bufferLayerId)) {
    map.removeLayer(bufferLayerId);
  }

  // Remove visual layer
  if (map.getLayer && map.getLayer('extended-guidelines')) {
    map.removeLayer('extended-guidelines');
  }
  if (map.getSource && map.getSource('extended-guidelines')) {
    map.removeSource('extended-guidelines');
  }

  // Clear snapping if it's pointing to extended guidelines
  if (
    this._ctx.snapping.snappedFeature &&
    this._ctx.snapping.snappedFeature.properties &&
    this._ctx.snapping.snappedFeature.properties.isExtendedGuideline
  ) {
    this._ctx.snapping.snappedGeometry = undefined;
    this._ctx.snapping.snappedFeature = undefined;
  }

  state.extendedGuidelines = null;
  state.hoveredIntersectionPoint = null;
  state.isHoveringExtendedGuidelines = false;
  state.isInExtendedGuidelinePersistenceZone = false;
  state.isActivelySnappingToGuideline = false;
};

/**
 * Update the opacity of extended guidelines based on snapping state.
 * Full opacity (0.3) when actively snapping, reduced opacity (0.15) when in persistence zone.
 */
DirectSelect.updateExtendedGuidelinesOpacity = function (state) {
  const map = this.map;
  if (!map || !map.getLayer("extended-guidelines")) return;

  // Full opacity when actively snapping, half opacity when in persistence zone but not snapping
  const opacity = state.isActivelySnappingToGuideline ? 0.3 : 0.15;

  map.setPaintProperty("extended-guidelines", "line-opacity", opacity);
};

// INTERNAL FUCNTIONS

DirectSelect.fireUpdate = function() {
  this.fire(Constants.events.UPDATE, {
    action: Constants.updateActions.CHANGE_COORDINATES,
    features: this.getSelected().map(f => f.toGeoJSON())
  });
};

DirectSelect.fireActionable = function(state) {
  this.setActionableState({
    combineFeatures: false,
    uncombineFeatures: false,
    trash: state.selectedCoordPaths.length > 0
  });
};

DirectSelect.startDragging = function(state, e) {
  state.initialDragPanState = this.map.dragPan.isEnabled();

  this.map.dragPan.disable();
  state.canDragMove = true;
  state.dragMoveLocation = e.lngLat;
  state.dragMoveStartLocation = e.lngLat; // Store original position for movement vector

  // Detect which edge was grabbed (for rail constraint)
  const clickedEdge = findClickedEdge(state.feature, e.lngLat);
  if (clickedEdge) {
    state.railEdge = clickedEdge;
  }

  // Show distance/angle input UI when starting to drag a single vertex
  if (state.selectedCoordPaths.length === 1) {
    this.showDistanceAngleUI(state);
  }
};

DirectSelect.stopDragging = function(state) {
  if (state.canDragMove && state.initialDragPanState === true) {
    this.map.dragPan.enable();
  }

  // Remove visualizations
  removeMovementVector(this.map);
  removeRailIndicator(this.map);
  removeAdjacentSegmentLengths(this.map);
  removeAllSnapIndicators(this.map);
  state.dragMoveStartLocation = null;

  // Clear rail constraint state
  state.railConstraintActive = false;
  state.railEdge = null;
  state.railDirection = null;
  state.railBearing = null;

  // Clear snapping state
  state.orthogonalSnapActive = false;
  state.parallelSnapActive = false;
  state.currentOrthogonalMatch = null;
  state.currentParallelMatch = null;

  // Clear hover debounce timer
  if (state.hoverDebounceTimer) {
    clearTimeout(state.hoverDebounceTimer);
    state.hoverDebounceTimer = null;
  }
  state.lastHoverPosition = null;

  // Remove extended guidelines
  this.removeExtendedGuidelines(state);

  // Remove guide circle
  this.removeGuideCircle(state);

  // Note: Do NOT hide distance/angle input UI here - it should stay visible
  // throughout the direct_select session. It only gets removed in onStop.

  state.dragMoving = false;
  state.canDragMove = false;
  state.dragMoveLocation = null;
  state.originalVertexCoord = null;
};

DirectSelect.onVertex = function (state, e) {
  this.startDragging(state, e);
  const about = e.featureTarget.properties;
  const selectedIndex = state.selectedCoordPaths.indexOf(about.coord_path);
  if (!isShiftDown(e) && selectedIndex === -1) {
    state.selectedCoordPaths = [about.coord_path];
  } else if (isShiftDown(e) && selectedIndex === -1) {
    state.selectedCoordPaths.push(about.coord_path);
  }

  // Store the actual vertex coordinate (not mouse position) for distance calculations
  if (state.selectedCoordPaths.length === 1) {
    const vertexCoord = state.feature.getCoordinate(state.selectedCoordPaths[0]);
    state.originalVertexCoord = vertexCoord; // [lng, lat]
  }

  // Extract adjacent segment bearings for single vertex selection (for orthogonal snapping)
  if (state.selectedCoordPaths.length === 1) {
    state.adjacentSegments = getAdjacentSegmentBearings(state.feature, state.selectedCoordPaths[0]);
  } else {
    state.adjacentSegments = null;
  }

  const selectedCoordinates = this.pathsToCoordinates(state.featureId, state.selectedCoordPaths);
  this.setSelectedCoordinates(selectedCoordinates);
};

DirectSelect.onMidpoint = function(state, e) {
  this.startDragging(state, e);
  const about = e.featureTarget.properties;
  state.feature.addCoordinate(about.coord_path, about.lng, about.lat);
  this.fireUpdate();
  state.selectedCoordPaths = [about.coord_path];
};

DirectSelect.pathsToCoordinates = function(featureId, paths) {
  return paths.map(coord_path => ({ feature_id: featureId, coord_path }));
};

DirectSelect.onFeature = function(state, e) {
  if (state.selectedCoordPaths.length === 0) this.startDragging(state, e);
  else this.stopDragging(state);
};

DirectSelect.dragFeature = function(state, e, delta) {
  moveFeatures(this.getSelected(), delta);
  state.dragMoveLocation = e.lngLat;
};

DirectSelect.dragVertex = function(state, e, delta) {
  const selectedCoords = state.selectedCoordPaths.map(coord_path => state.feature.getCoordinate(coord_path));
  const selectedCoordPoints = selectedCoords.map(coords => ({
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates: coords
    }
  }));

  const constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);
  for (let i = 0; i < selectedCoords.length; i++) {
    const coord = selectedCoords[i];
    state.feature.updateCoordinate(state.selectedCoordPaths[i], coord[0] + constrainedDelta.lng, coord[1] + constrainedDelta.lat);
  }
};

DirectSelect.clickNoTarget = function () {
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DirectSelect.clickInactive = function () {
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DirectSelect.clickActiveFeature = function (state) {
  state.selectedCoordPaths = [];
  this.clearSelectedCoordinates();
  state.feature.changed();
};

// EXTERNAL FUNCTIONS

DirectSelect.onSetup = function(opts) {
  const featureId = opts.featureId;
  const feature = this.getFeature(featureId);

  if (!feature) {
    throw new Error('You must provide a featureId to enter direct_select mode');
  }

  if (feature.type === Constants.geojsonTypes.POINT) {
    throw new TypeError('direct_select mode doesn\'t handle point features');
  }

  const state = {
    featureId,
    feature,
    dragMoveLocation: opts.startPos || null,
    dragMoveStartLocation: null, // Original grab position for movement vector
    dragMoving: false,
    canDragMove: false,
    selectedCoordPaths: opts.coordPath ? [opts.coordPath] : [],
    // Rail constraint state
    railConstraintActive: false,
    railEdge: null, // Edge that was grabbed
    railDirection: null, // Determined rail direction
    railBearing: null, // Bearing to constrain movement to
    // Snapping state
    adjacentSegments: null, // Bearings of segments adjacent to selected vertex
    orthogonalSnapActive: false,
    parallelSnapActive: false,
    currentOrthogonalMatch: null,
    currentParallelMatch: null,
    snapTolerance: 20, // Default snap tolerance in pixels
    // Distance/Angle input state
    currentDistance: null,
    currentAngle: null,
    distanceInput: null,
    angleInput: null,
    distanceContainer: null,
    // Extended guideline state
    extendedGuidelines: null,
    hoveredIntersectionPoint: null,
    isHoveringExtendedGuidelines: false,
    isInExtendedGuidelinePersistenceZone: false, // true when within 5x snap distance of guideline
    isActivelySnappingToGuideline: false, // true when actually snapping to the guideline
    extendedGuidelineMouseoverHandler: null,
    extendedGuidelineMouseoutHandler: null,
    hoverDebounceTimer: null,
    lastHoverPosition: null,
    // Guide circle state
    guideCircle: null,
    guideCircleRadius: null,
    guideCircleCenter: null,
    // Original vertex position for distance calculations
    originalVertexCoord: null
  };

  this.setSelected(featureId);
  this.setSelectedCoordinates(this.pathsToCoordinates(featureId, state.selectedCoordPaths));
  doubleClickZoom.disable(this);

  this.setActionableState({
    trash: true
  });

  // Create distance/angle input UI
  this.createDistanceInput(state);
  this.createAngleInput(state);

  return state;
};

DirectSelect.onStop = function(state) {
  doubleClickZoom.enable(this);
  this.clearSelectedCoordinates();

  // Ensure dragPan is re-enabled when exiting the mode
  // This handles cases where stopDragging wasn't called or failed to re-enable it
  if (state && state.initialDragPanState === true && this.map && this.map.dragPan) {
    this.map.dragPan.enable();
  }

  // Clean up visualizations on mode exit
  removeMovementVector(this.map);
  removeRailIndicator(this.map);
  removeAllSnapIndicators(this.map);
  removeAdjacentSegmentLengths(this.map);
  // Clean up distance/angle input UI and extended guidelines
  if (state) {
    this.removeDistanceAngleUI(state);
    this.removeExtendedGuidelines(state);
  }
};

DirectSelect.toDisplayFeatures = function(state, geojson, push) {
  if (state.featureId === geojson.properties.id) {
    geojson.properties.active = Constants.activeStates.ACTIVE;
    push(geojson);
    createSupplementaryPoints(geojson, {
      map: this.map,
      midpoints: true,
      selectedPaths: state.selectedCoordPaths
    }).forEach(push);
  } else {
    geojson.properties.active = Constants.activeStates.INACTIVE;
    push(geojson);
  }
  this.fireActionable(state);
};

DirectSelect.onTrash = function(state) {
  // Uses number-aware sorting to make sure '9' < '10'. Comparison is reversed because we want them
  // in reverse order so that we can remove by index safely.
  state.selectedCoordPaths
    .sort((a, b) => b.localeCompare(a, 'en', { numeric: true }))
    .forEach(id => state.feature.removeCoordinate(id));
  this.fireUpdate();
  state.selectedCoordPaths = [];
  this.clearSelectedCoordinates();
  this.fireActionable(state);
  if (state.feature.isValid() === false) {
    this.deleteFeature([state.featureId]);
    this.changeMode(Constants.modes.SIMPLE_SELECT, {});
  }
};

DirectSelect.onMouseMove = function(state, e) {
  // On mousemove that is not a drag, stop vertex movement.
  const isFeature = isActiveFeature(e);
  const onVertex = isVertex(e);
  const isMidPoint = isMidpoint(e);
  const noCoords = state.selectedCoordPaths.length === 0;
  if (isFeature && noCoords) this.updateUIClasses({ mouse: Constants.cursors.MOVE });
  else if (onVertex && !noCoords) this.updateUIClasses({ mouse: Constants.cursors.MOVE });
  else this.updateUIClasses({ mouse: Constants.cursors.NONE });

  const isDraggableItem = onVertex || isFeature || isMidPoint;
  if (isDraggableItem && state.dragMoving) this.fireUpdate();

  this.stopDragging(state);

  // Skip render
  return true;
};

DirectSelect.onMouseOut = function(state) {
  // As soon as you mouse leaves the canvas, update the feature
  if (state.dragMoving) this.fireUpdate();

  // Skip render
  return true;
};

DirectSelect.onTouchStart = DirectSelect.onMouseDown = function(state, e) {
  if (isVertex(e)) return this.onVertex(state, e);
  if (isActiveFeature(e)) return this.onFeature(state, e);
  if (isMidpoint(e)) return this.onMidpoint(state, e);
};

DirectSelect.onDrag = function(state, e) {
  if (state.canDragMove !== true) return;
  state.dragMoving = true;
  e.originalEvent.stopPropagation();
  let lngLat = e.lngLat;

  const shiftHeld = isShiftDown(e);

  // ============================================================
  // PRIORITY #1: SHIFT KEY BYPASS (highest priority)
  // Shift held bypasses ALL snapping including rail constraint
  // ============================================================
  if (shiftHeld) {
    if (state.selectedCoordPaths.length === 1) {
      this.removeGuideCircle(state);
      removeAllSnapIndicators(this.map);
      removeRailIndicator(this.map);
      state.railConstraintActive = false;
      state.orthogonalSnapActive = false;
      state.parallelSnapActive = false;
      state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);
      state.dragMoveLocation = lngLat;
      if (state.dragMoveStartLocation) {
        showMovementVector(this.map, state.dragMoveStartLocation, lngLat);
      }
      showAdjacentSegmentLengths(this.map, state.feature, state.selectedCoordPaths[0], lngLat);
      return;
    } else {
      // Multiple vertices or feature dragging with shift
      this.removeGuideCircle(state);
      const delta = {
        lng: lngLat.lng - state.dragMoveLocation.lng,
        lat: lngLat.lat - state.dragMoveLocation.lat
      };
      if (state.selectedCoordPaths.length > 0) this.dragVertex(state, e, delta);
      else this.dragFeature(state, e, delta);
      state.dragMoveLocation = lngLat;
      if (state.dragMoveStartLocation) {
        showMovementVector(this.map, state.dragMoveStartLocation, lngLat);
      }
      removeAdjacentSegmentLengths(this.map);
      return;
    }
  }

  // ============================================================
  // PRIORITY #2: RAIL CONSTRAINT
  // When edge was grabbed, constrain to perpendicular/parallel movement
  // ============================================================
  if (state.railEdge && state.dragMoveStartLocation) {
    const railDir = determineRailDirection(
      state.dragMoveStartLocation,
      lngLat,
      state.railEdge.bearing,
      15
    );

    if (railDir) {
      state.railConstraintActive = true;
      state.railDirection = railDir.name;
      state.railBearing = railDir.bearing;

      showRailIndicator(
        this.map,
        state.dragMoveStartLocation,
        state.railEdge.bearing,
        state.railBearing
      );

      lngLat = constrainToRail(state.dragMoveStartLocation, lngLat, state.railBearing);

      // Rail constraint is active - update coordinate and skip all other snapping
      if (state.selectedCoordPaths.length === 1) {
        this.removeGuideCircle(state);
        removeAllSnapIndicators(this.map);
        state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);
        state.dragMoveLocation = lngLat;
        if (state.dragMoveStartLocation) {
          showMovementVector(this.map, state.dragMoveStartLocation, lngLat);
        }
        showAdjacentSegmentLengths(this.map, state.feature, state.selectedCoordPaths[0], lngLat);
        return;
      }
    } else {
      state.railConstraintActive = false;
      removeRailIndicator(this.map);
    }
  }

  if (state.selectedCoordPaths.length === 1) {
    // Single vertex dragging - apply snapping following draw_line_string_distance pattern

    // Handle extended guideline hover detection (similar to draw_line_string_distance)
    if (!shiftHeld) {
      const intersectionPointInfo = this.detectHoveredIntersectionPoint(state, e);

      if (intersectionPointInfo) {
        const currentCoord = intersectionPointInfo.coord;
        const isDifferentPoint = !state.lastHoverPosition ||
          state.lastHoverPosition[0] !== currentCoord[0] ||
          state.lastHoverPosition[1] !== currentCoord[1];

        if (isDifferentPoint) {
          let keepExistingGuidelines = false;
          if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
            const snapDistance = this._ctx.options.snapDistance || 20;
            const persistenceZone = snapDistance * 5;
            const pixelDistanceToGuideline = calculatePixelDistanceToExtendedGuidelines(
              this.map,
              state.extendedGuidelines,
              lngLat
            );
            keepExistingGuidelines = pixelDistanceToGuideline <= persistenceZone;
          }

          if (keepExistingGuidelines) {
            if (intersectionPointInfo.feature && this._ctx.snapping) {
              this._ctx.snapping.setSnapHoverState(intersectionPointInfo.feature, false);
            }
            state.isActivelySnappingToGuideline = false;
            state.isInExtendedGuidelinePersistenceZone = true;
            this.updateExtendedGuidelinesOpacity(state);
          } else {
            if (state.hoverDebounceTimer) {
              clearTimeout(state.hoverDebounceTimer);
              state.hoverDebounceTimer = null;
            }
            this.removeExtendedGuidelines(state);

            state.hoveredIntersectionPoint = intersectionPointInfo;
            state.lastHoverPosition = [currentCoord[0], currentCoord[1]];

            state.hoverDebounceTimer = setTimeout(() => {
              const extendedLines = this.extendGuidelines(state, intersectionPointInfo);
              state.extendedGuidelines = extendedLines;
              this.renderExtendedGuidelines(state, extendedLines);
              state.isActivelySnappingToGuideline = true;
              state.isInExtendedGuidelinePersistenceZone = true;
            }, 500);
          }
        } else if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
          state.isActivelySnappingToGuideline = true;
          state.isInExtendedGuidelinePersistenceZone = true;
          this.updateExtendedGuidelinesOpacity(state);
        }
      } else {
        if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
          const snapDistance = this._ctx.options.snapDistance || 20;
          const persistenceZone = snapDistance * 5;
          const pixelDistanceToGuideline = calculatePixelDistanceToExtendedGuidelines(
            this.map,
            state.extendedGuidelines,
            lngLat
          );

          state.isActivelySnappingToGuideline = state.isHoveringExtendedGuidelines;
          state.isInExtendedGuidelinePersistenceZone = pixelDistanceToGuideline <= persistenceZone;

          this.updateExtendedGuidelinesOpacity(state);

          if (!state.isInExtendedGuidelinePersistenceZone) {
            if (state.hoverDebounceTimer) {
              clearTimeout(state.hoverDebounceTimer);
              state.hoverDebounceTimer = null;
            }
            this.removeExtendedGuidelines(state);
            state.lastHoverPosition = null;
          }
        } else if (!state.isHoveringExtendedGuidelines) {
          if (state.hoverDebounceTimer) {
            clearTimeout(state.hoverDebounceTimer);
            state.hoverDebounceTimer = null;
          }
          state.lastHoverPosition = null;
        }
      }
    }

    // Reference point for all distance/bearing calculations
    const distanceOrigin = state.originalVertexCoord ||
      [state.dragMoveStartLocation.lng, state.dragMoveStartLocation.lat];
    const from = turf.point(distanceOrigin);

    const hasUserDistance = state.currentDistance !== null && state.currentDistance > 0;
    const hasUserAngle = state.currentAngle !== null && !isNaN(state.currentAngle);

    // Get snap info using the same pattern as draw_line_string_distance
    let snapInfo = null;
    const extendedGuidelinesActive = state.extendedGuidelines && state.extendedGuidelines.length > 0;

    if (extendedGuidelinesActive) {
      // Check if cursor is near the intersection point that triggered the guidelines
      if (state.hoveredIntersectionPoint) {
        const intersectionCoord = state.hoveredIntersectionPoint.coord;
        const distToIntersection = turf.distance(
          turf.point(intersectionCoord),
          turf.point([lngLat.lng, lngLat.lat]),
          { units: 'meters' }
        );
        const metersPerPixel = 156543.03392 * Math.cos(lngLat.lat * Math.PI / 180) / Math.pow(2, this.map.getZoom());
        const snapToleranceMeters = (this._ctx.options.snapDistance || 20) * metersPerPixel;

        if (distToIntersection <= snapToleranceMeters) {
          snapInfo = {
            type: 'point',
            coord: intersectionCoord,
            snappedFeature: state.hoveredIntersectionPoint.feature
          };
        }
      }

      if (!snapInfo) {
        const snapping = this._ctx.snapping;
        if (snapping && snapping.snappedFeature) {
          const isExtendedGuideline =
            snapping.snappedFeature.properties &&
            snapping.snappedFeature.properties.isExtendedGuideline;

          if (isExtendedGuideline) {
            snapInfo = this.getSnapInfo(lngLat);
          } else {
            const tempSnapInfo = this.getSnapInfo(lngLat);
            const isSnappingPoint =
              snapping.snappedFeature.properties &&
              snapping.snappedFeature.properties.type === 'snappingPoint';

            if (isSnappingPoint && tempSnapInfo && tempSnapInfo.type === 'point') {
              snapInfo = tempSnapInfo;
            } else if (tempSnapInfo && tempSnapInfo.type === 'line') {
              const intersectionSnap = findExtendedGuidelineIntersection(
                state.extendedGuidelines,
                tempSnapInfo,
                lngLat,
                state.snapTolerance || 20
              );
              if (intersectionSnap) {
                snapInfo = intersectionSnap;
              }
            }
          }
        }
      }
    } else {
      snapInfo = this.getSnapInfo(lngLat);
    }

    // Calculate mouse bearing and distance
    const mouseBearing = turf.bearing(from, turf.point([lngLat.lng, lngLat.lat]));
    const mouseDistance = turf.distance(from, turf.point([lngLat.lng, lngLat.lat]), { units: 'kilometers' });

    const orthogonalTolerance = this._ctx.options.orthogonalSnapTolerance || 5;
    const parallelTolerance = this._ctx.options.parallelSnapTolerance || 5;

    // Check orthogonal snapping
    let orthogonalMatch = null;
    let isPerpendicularToGuideline = false;

    if (extendedGuidelinesActive) {
      const guidelineBearings = getExtendedGuidelineBearings(state.extendedGuidelines);
      orthogonalMatch = getPerpendicularToGuidelineBearing(guidelineBearings, mouseBearing, orthogonalTolerance);
      if (orthogonalMatch) isPerpendicularToGuideline = true;
    } else if (state.adjacentSegments && state.adjacentSegments.length > 0) {
      orthogonalMatch = getOrthogonalSnapBearing(state.adjacentSegments, mouseBearing, orthogonalTolerance);
    }

    // Check parallel line snap (only when extended guidelines are NOT active)
    let parallelLineMatch = null;
    if (!extendedGuidelinesActive) {
      const nearbyLines = findNearbyParallelLines(this._ctx, this.map, distanceOrigin, lngLat);
      parallelLineMatch = getParallelBearing(nearbyLines, mouseBearing, parallelTolerance);
    }

    // Check perpendicular-to-line snap (only when extended guidelines are NOT active)
    let perpendicularToLineSnap = null;
    if (!extendedGuidelinesActive && snapInfo && snapInfo.type === 'line') {
      const perpPoint = calculatePerpendicularToLine(distanceOrigin, snapInfo.segment, lngLat);
      if (perpPoint) {
        perpendicularToLineSnap = {
          coord: perpPoint.coord,
          distanceFromCursor: perpPoint.distanceFromCursor,
          lineSegment: snapInfo.segment,
          lineBearing: snapInfo.bearing
        };
      }
    }

    // Resolve conflicts between orthogonal and parallel snapping
    const resolved = resolveSnapConflicts({
      orthogonalMatch,
      parallelLineMatch,
      bothSnapsActive: false,
      lastVertex: distanceOrigin,
      lngLat,
      closingPerpendicularSnap: null,
      proximityThreshold: this._ctx.options.parallelSnapProximityThreshold || 10,
      mouseBearing
    });
    orthogonalMatch = resolved.orthogonalMatch;
    parallelLineMatch = resolved.parallelLineMatch;

    // Check if perpendicular-to-line snap should override
    const snapTolerance = this._ctx.options.snapDistance || 20;
    const metersPerPixel = 156543.03392 * Math.cos(lngLat.lat * Math.PI / 180) / Math.pow(2, this.map.getZoom());
    const snapToleranceMeters = snapTolerance * metersPerPixel;

    let isPerpendicularToLineSnap = false;
    if (perpendicularToLineSnap && perpendicularToLineSnap.distanceFromCursor <= snapToleranceMeters) {
      let shouldUsePerpendicular = true;

      if (orthogonalMatch !== null) {
        const orthogonalPoint = turf.destination(from, 0.1, orthogonalMatch.bearing, { units: 'kilometers' });
        const orthogonalDist = turf.distance(turf.point([lngLat.lng, lngLat.lat]), orthogonalPoint, { units: 'meters' });
        if (orthogonalDist < perpendicularToLineSnap.distanceFromCursor) {
          shouldUsePerpendicular = false;
        }
      }

      if (shouldUsePerpendicular && parallelLineMatch !== null) {
        const parallelPoint = turf.destination(from, 0.1, parallelLineMatch.bearing, { units: 'kilometers' });
        const parallelDist = turf.distance(turf.point([lngLat.lng, lngLat.lat]), parallelPoint, { units: 'meters' });
        if (parallelDist < perpendicularToLineSnap.distanceFromCursor) {
          shouldUsePerpendicular = false;
        }
      }

      if (shouldUsePerpendicular) {
        snapInfo = {
          type: 'point',
          coord: perpendicularToLineSnap.coord,
          snappedFeature: snapInfo.snappedFeature
        };
        isPerpendicularToLineSnap = true;
        orthogonalMatch = null;
        parallelLineMatch = null;
      }
    }

    // Determine direction (bearing) priority - matching draw_line_string_distance pattern
    let bearingToUse = mouseBearing;
    let usePointDirection = false;
    let isOrthogonalSnap = false;
    let isParallelLineSnap = false;

    if (hasUserAngle) {
      bearingToUse = state.currentAngle;
    } else if (snapInfo && snapInfo.type === 'point') {
      bearingToUse = turf.bearing(from, turf.point(snapInfo.coord));
      usePointDirection = true;
    } else if (orthogonalMatch !== null && (!extendedGuidelinesActive || isPerpendicularToGuideline)) {
      bearingToUse = orthogonalMatch.bearing;
      isOrthogonalSnap = true;
    } else if (parallelLineMatch !== null && !extendedGuidelinesActive) {
      bearingToUse = parallelLineMatch.bearing;
      isParallelLineSnap = true;
    } else if (snapInfo && snapInfo.type === 'line') {
      bearingToUse = snapInfo.bearing;
    }

    // ============================================================
    // PRIORITY #3: DISTANCE + ANGLE INPUT (exact point)
    // ============================================================
    let finalLngLat;

    if (hasUserDistance) {
      this.updateGuideCircle(state, distanceOrigin, state.currentDistance);

      if (snapInfo && snapInfo.type === 'point') {
        finalLngLat = { lng: snapInfo.coord[0], lat: snapInfo.coord[1] };
      } else if (snapInfo && snapInfo.type === 'line') {
        const circleLineIntersection = calculateCircleLineIntersection(
          distanceOrigin,
          state.currentDistance,
          snapInfo.segment,
          [lngLat.lng, lngLat.lat]
        );
        if (circleLineIntersection) {
          finalLngLat = { lng: circleLineIntersection.coord[0], lat: circleLineIntersection.coord[1] };
        } else {
          const dest = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
          finalLngLat = { lng: dest.geometry.coordinates[0], lat: dest.geometry.coordinates[1] };
        }
      } else {
        const dest = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
        finalLngLat = { lng: dest.geometry.coordinates[0], lat: dest.geometry.coordinates[1] };
      }
    } else if (isOrthogonalSnap && snapInfo && snapInfo.type === 'line') {
      this.removeGuideCircle(state);
      const intersection = calculateLineIntersection(distanceOrigin, bearingToUse, snapInfo.segment);
      if (intersection) {
        finalLngLat = { lng: intersection.coord[0], lat: intersection.coord[1] };
      } else {
        const dest = turf.destination(from, mouseDistance, bearingToUse, { units: 'kilometers' });
        finalLngLat = { lng: dest.geometry.coordinates[0], lat: dest.geometry.coordinates[1] };
      }
    } else if (usePointDirection && snapInfo) {
      this.removeGuideCircle(state);
      finalLngLat = { lng: snapInfo.coord[0], lat: snapInfo.coord[1] };
    } else if (snapInfo && snapInfo.type === 'line') {
      this.removeGuideCircle(state);
      finalLngLat = { lng: snapInfo.coord[0], lat: snapInfo.coord[1] };
    } else if (isOrthogonalSnap || isParallelLineSnap) {
      this.removeGuideCircle(state);
      const dest = turf.destination(from, mouseDistance, bearingToUse, { units: 'kilometers' });
      finalLngLat = { lng: dest.geometry.coordinates[0], lat: dest.geometry.coordinates[1] };
    } else {
      this.removeGuideCircle(state);
      finalLngLat = lngLat;
    }

    // Show visual indicators
    state.orthogonalSnapActive = isOrthogonalSnap;
    state.parallelSnapActive = isParallelLineSnap;

    if (isOrthogonalSnap && orthogonalMatch) {
      state.currentOrthogonalMatch = orthogonalMatch;
      const isCollinear = orthogonalMatch.angleFromReference === 0 || orthogonalMatch.angleFromReference === 180;
      if (isCollinear) {
        showCollinearSnapLine(this.map, distanceOrigin, orthogonalMatch.referenceBearing);
        removeRightAngleIndicator(this.map);
      } else {
        showRightAngleIndicator(this.map, distanceOrigin, orthogonalMatch.referenceBearing, orthogonalMatch.bearing);
        removeCollinearSnapLine(this.map);
      }
      removeParallelLineIndicator(this.map);
    } else if (isParallelLineSnap && parallelLineMatch) {
      state.currentParallelMatch = parallelLineMatch;
      showParallelLineIndicator(this.map, distanceOrigin, parallelLineMatch.bearing);
      removeRightAngleIndicator(this.map);
      removeCollinearSnapLine(this.map);
    } else {
      removeAllSnapIndicators(this.map);
    }

    lngLat = finalLngLat;
    state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);

  } else {
    // Multiple vertices or feature dragging
    this.removeGuideCircle(state);
    const delta = {
      lng: lngLat.lng - state.dragMoveLocation.lng,
      lat: lngLat.lat - state.dragMoveLocation.lat
    };

    if (state.selectedCoordPaths.length > 0) this.dragVertex(state, e, delta);
    else this.dragFeature(state, e, delta);
  }

  state.dragMoveLocation = lngLat;

  if (state.dragMoveStartLocation) {
    showMovementVector(this.map, state.dragMoveStartLocation, lngLat);
  }

  if (state.selectedCoordPaths.length === 1) {
    showAdjacentSegmentLengths(this.map, state.feature, state.selectedCoordPaths[0], lngLat);
  } else {
    removeAdjacentSegmentLengths(this.map);
  }
};

DirectSelect.onClick = function(state, e) {
  if (noTarget(e)) return this.clickNoTarget(state, e);
  if (isActiveFeature(e)) return this.clickActiveFeature(state, e);
  if (isInactiveFeature(e)) return this.clickInactive(state, e);
  this.stopDragging(state);
};

DirectSelect.onTap = function(state, e) {
  if (noTarget(e)) return this.clickNoTarget(state, e);
  if (isActiveFeature(e)) return this.clickActiveFeature(state, e);
  if (isInactiveFeature(e)) return this.clickInactive(state, e);
};

DirectSelect.onTouchEnd = DirectSelect.onMouseUp = function(state) {
  if (state.dragMoving) {
    this.fireUpdate();
  }
  this.stopDragging(state);
};

export default DirectSelect;

