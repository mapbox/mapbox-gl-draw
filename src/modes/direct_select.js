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
  findNearbyParallelLines,
  getParallelBearing,
  calculatePerpendicularToLine,
  getExtendedGuidelineBearings,
  getPerpendicularToGuidelineBearing,
  getAdjacentSegmentsAtVertex,
  calculatePixelDistanceToExtendedGuidelines
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

  // Check if shift is held to temporarily disable snapping
  const shiftHeld = isShiftDown(e);

  // Handle rail constraint when edge was grabbed
  if (state.railEdge && state.dragMoveStartLocation) {
    // Continuously determine rail direction based on current mouse position
    const railDir = determineRailDirection(
      state.dragMoveStartLocation,
      lngLat,
      state.railEdge.bearing,
      15 // Angular tolerance in degrees
    );

    if (railDir) {
      // Within tolerance - snap to rail
      state.railConstraintActive = true;
      state.railDirection = railDir.name;
      state.railBearing = railDir.bearing;

      // Show L-shaped indicator at grab point
      showRailIndicator(
        this.map,
        state.dragMoveStartLocation,
        state.railEdge.bearing,
        state.railBearing
      );

      // Constrain movement to current rail direction
      lngLat = constrainToRail(state.dragMoveStartLocation, lngLat, state.railBearing);
    } else {
      // Outside tolerance - allow free movement
      state.railConstraintActive = false;
      removeRailIndicator(this.map);
    }
  }

  if (state.selectedCoordPaths.length === 1) {
    // Single vertex dragging - apply enhanced snapping

    // Handle extended guideline hover detection
    if (!shiftHeld && !state.railConstraintActive) {
      const intersectionPointInfo = this.detectHoveredIntersectionPoint(state, e);

      if (intersectionPointInfo) {
        // Hovering over an intersection or midpoint
        const currentCoord = intersectionPointInfo.coord;
        const lastPos = state.lastHoverPosition;

        // Check if this is a different point than before
        const isDifferentPoint = !lastPos ||
          Math.abs(currentCoord[0] - lastPos[0]) > 0.000001 ||
          Math.abs(currentCoord[1] - lastPos[1]) > 0.000001;

        if (isDifferentPoint) {
          // Check if we have existing extended guidelines and are within their persistence zone
          let keepExistingGuidelines = false;
          if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
            const snapDistance = this._ctx.options.snapDistance || 20;
            const persistenceZone = snapDistance * 5;
            const pixelDistanceToGuideline = calculatePixelDistanceToExtendedGuidelines(
              this.map,
              state.extendedGuidelines,
              e.lngLat
            );
            keepExistingGuidelines = pixelDistanceToGuideline <= persistenceZone;
          }

          if (keepExistingGuidelines) {
            // We're within persistence zone of existing guidelines - keep them
            // Clear snap-hover state for the different point we detected but won't use
            if (intersectionPointInfo.feature && this._ctx.snapping) {
              this._ctx.snapping.setSnapHoverState(intersectionPointInfo.feature, false);
            }
            // Update opacity to faded since we're not actively snapping to them
            state.isActivelySnappingToGuideline = false;
            state.isInExtendedGuidelinePersistenceZone = true;
            this.updateExtendedGuidelinesOpacity(state);
            // Don't start new debounce for the different point
          } else {
            // Clear existing debounce timer and extended guidelines
            if (state.hoverDebounceTimer) {
              clearTimeout(state.hoverDebounceTimer);
              state.hoverDebounceTimer = null;
            }
            this.removeExtendedGuidelines(state);

            // Store new intersection point info
            state.hoveredIntersectionPoint = intersectionPointInfo;
            state.lastHoverPosition = [currentCoord[0], currentCoord[1]];

            // Start new debounce timer (500ms)
            state.hoverDebounceTimer = setTimeout(() => {
              // Extend and render guidelines
              const extendedLines = this.extendGuidelines(state, intersectionPointInfo);
              state.extendedGuidelines = extendedLines;
              this.renderExtendedGuidelines(state, extendedLines);
              // Set initial opacity state - actively snapping since we're hovering intersection
              state.isActivelySnappingToGuideline = true;
              state.isInExtendedGuidelinePersistenceZone = true;
            }, 500);
          }
        } else if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
          // Same point, guidelines exist - update opacity to full since we're on the intersection
          state.isActivelySnappingToGuideline = true;
          state.isInExtendedGuidelinePersistenceZone = true;
          this.updateExtendedGuidelinesOpacity(state);
        }
      } else {
        // Not hovering over an intersection point
        // Check if we're within the persistence zone (5x snap distance) of extended guidelines
        if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
          const snapDistance = this._ctx.options.snapDistance || 20;
          const persistenceZone = snapDistance * 5; // 5x snap distance for persistence
          const pixelDistanceToGuideline = calculatePixelDistanceToExtendedGuidelines(
            this.map,
            state.extendedGuidelines,
            e.lngLat
          );

          // Update state for whether we're actively snapping or just in persistence zone
          state.isActivelySnappingToGuideline = state.isHoveringExtendedGuidelines;
          state.isInExtendedGuidelinePersistenceZone = pixelDistanceToGuideline <= persistenceZone;

          // Update guideline opacity based on snapping state
          this.updateExtendedGuidelinesOpacity(state);

          // Only remove guidelines if we're outside the persistence zone
          if (!state.isInExtendedGuidelinePersistenceZone) {
            if (state.hoverDebounceTimer) {
              clearTimeout(state.hoverDebounceTimer);
              state.hoverDebounceTimer = null;
            }
            this.removeExtendedGuidelines(state);
            state.lastHoverPosition = null;
          }
        } else if (!state.isHoveringExtendedGuidelines) {
          // No guidelines exist yet, clear any pending debounce timer
          if (state.hoverDebounceTimer) {
            clearTimeout(state.hoverDebounceTimer);
            state.hoverDebounceTimer = null;
          }
          state.lastHoverPosition = null;
        }
      }
    }

    // IMPORTANT: For distance calculations, ALWAYS use the original vertex position
    // (not the mouse click position which may be slightly offset)
    // This ensures distance input measures from the vertex's true original position
    const distanceOrigin = state.originalVertexCoord ||
      [state.dragMoveStartLocation.lng, state.dragMoveStartLocation.lat];

    // Check if user has entered distance or angle constraints
    // DISTANCE INPUT TAKES ABSOLUTE PRIORITY over all other snapping
    const hasUserDistance = state.currentDistance !== null && state.currentDistance > 0;
    const hasUserAngle = state.currentAngle !== null && !isNaN(state.currentAngle);

    // Calculate mouse bearing from origin to current mouse position
    const mouseBearing = turf.bearing(
      turf.point(distanceOrigin),
      turf.point([lngLat.lng, lngLat.lat])
    );

    // Calculate mouse distance (only used when no distance constraint)
    const mouseDistance = turf.distance(
      turf.point(distanceOrigin),
      turf.point([lngLat.lng, lngLat.lat]),
      { units: 'kilometers' }
    );

    // ============================================================
    // DISTANCE INPUT PRIORITY: When distance is specified, the final
    // position MUST be exactly that distance from the original vertex.
    // No other snapping can override this distance.
    // ============================================================
    if (hasUserDistance) {
      // Show guide circle at the user-specified distance
      this.updateGuideCircle(state, distanceOrigin, state.currentDistance);

      let bearingToUse = mouseBearing;

      // If angle is also specified, use exact position
      if (hasUserAngle) {
        bearingToUse = state.currentAngle;
        removeAllSnapIndicators(this.map);
      } else if (!shiftHeld) {
        // Only snap bearing (not distance) when shift is not held
        const orthogonalTolerance = this._ctx.options.orthogonalSnapTolerance || 5;
        const parallelTolerance = this._ctx.options.parallelSnapTolerance || 5;

        // Check for orthogonal snap to adjacent segments
        let orthogonalMatch = null;
        if (state.adjacentSegments && state.adjacentSegments.length > 0) {
          orthogonalMatch = getOrthogonalSnapBearing(state.adjacentSegments, mouseBearing, orthogonalTolerance);
        }

        // Check for orthogonal snap to extended guidelines
        if (!orthogonalMatch && state.extendedGuidelines && state.extendedGuidelines.length > 0) {
          const guidelineBearings = getExtendedGuidelineBearings(state.extendedGuidelines);
          orthogonalMatch = getPerpendicularToGuidelineBearing(guidelineBearings, mouseBearing, orthogonalTolerance);
        }

        // Check for parallel snap to nearby lines (only if no orthogonal match)
        let parallelMatch = null;
        if (!orthogonalMatch) {
          const nearbyLines = findNearbyParallelLines(this._ctx, this.map, distanceOrigin, lngLat);
          if (nearbyLines && nearbyLines.length > 0) {
            parallelMatch = getParallelBearing(nearbyLines, mouseBearing, parallelTolerance);
          }
        }

        if (orthogonalMatch) {
          bearingToUse = orthogonalMatch.bearing;
          state.orthogonalSnapActive = true;
          state.parallelSnapActive = false;
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
        } else if (parallelMatch) {
          bearingToUse = parallelMatch.bearing;
          state.orthogonalSnapActive = false;
          state.parallelSnapActive = true;
          state.currentParallelMatch = parallelMatch;

          showParallelLineIndicator(this.map, distanceOrigin, parallelMatch.bearing);
          removeRightAngleIndicator(this.map);
          removeCollinearSnapLine(this.map);
        } else {
          state.orthogonalSnapActive = false;
          state.parallelSnapActive = false;
          removeAllSnapIndicators(this.map);
        }
      } else {
        // Shift held - no bearing snap
        state.orthogonalSnapActive = false;
        state.parallelSnapActive = false;
        removeAllSnapIndicators(this.map);
      }

      // ALWAYS calculate final position at EXACTLY the user-specified distance
      const destinationPoint = turf.destination(
        turf.point(distanceOrigin),
        state.currentDistance / 1000, // Convert meters to kilometers
        bearingToUse,
        { units: 'kilometers' }
      );
      lngLat = {
        lng: destinationPoint.geometry.coordinates[0],
        lat: destinationPoint.geometry.coordinates[1]
      };
      state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);

    } else if (hasUserAngle) {
      // Angle constraint only (relative to TRUE NORTH) - use mouse distance
      this.removeGuideCircle(state);

      const destinationPoint = turf.destination(
        turf.point(distanceOrigin),
        mouseDistance,
        state.currentAngle,
        { units: 'kilometers' }
      );
      lngLat = {
        lng: destinationPoint.geometry.coordinates[0],
        lat: destinationPoint.geometry.coordinates[1]
      };
      removeAllSnapIndicators(this.map);
      state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);

    } else if (shiftHeld) {
      // Shift key bypasses all snapping (no distance/angle constraint)
      removeAllSnapIndicators(this.map);
      this.removeGuideCircle(state);
      state.orthogonalSnapActive = false;
      state.parallelSnapActive = false;
      state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);

    } else if (!state.railConstraintActive) {
      // No distance/angle constraints - use regular snapping logic
      this.removeGuideCircle(state);

      const orthogonalTolerance = this._ctx.options.orthogonalSnapTolerance || 5;
      const parallelTolerance = this._ctx.options.parallelSnapTolerance || 5;

      // Check for orthogonal snap to adjacent segments
      let orthogonalMatch = null;
      if (state.adjacentSegments && state.adjacentSegments.length > 0) {
        orthogonalMatch = getOrthogonalSnapBearing(state.adjacentSegments, mouseBearing, orthogonalTolerance);
      }

      // Check for orthogonal snap to extended guidelines
      if (!orthogonalMatch && state.extendedGuidelines && state.extendedGuidelines.length > 0) {
        const guidelineBearings = getExtendedGuidelineBearings(state.extendedGuidelines);
        orthogonalMatch = getPerpendicularToGuidelineBearing(guidelineBearings, mouseBearing, orthogonalTolerance);
      }

      // Check for parallel snap to nearby lines
      let parallelMatch = null;
      const nearbyLines = findNearbyParallelLines(this._ctx, this.map, distanceOrigin, lngLat);
      if (nearbyLines && nearbyLines.length > 0) {
        parallelMatch = getParallelBearing(nearbyLines, mouseBearing, parallelTolerance);
      }

      // Check for perpendicular-to-line snap
      let perpendicularMatch = null;
      const snappedCoord = this._ctx.snapping.snapCoord(lngLat);
      const snapInfo = this._ctx.snapping.snappedFeature;
      if (snapInfo && snapInfo.geometry && (snapInfo.geometry.type === 'LineString' || snapInfo.geometry.type === 'Polygon')) {
        let coords = snapInfo.geometry.coordinates;
        if (snapInfo.geometry.type === 'Polygon') {
          coords = coords[0];
        }
        if (coords.length >= 2) {
          const snapPoint = turf.point([snappedCoord.lng, snappedCoord.lat]);
          let nearestSegment = null;
          let minDist = Infinity;
          for (let i = 0; i < coords.length - 1; i++) {
            const segLine = turf.lineString([coords[i], coords[i + 1]]);
            const nearest = turf.nearestPointOnLine(segLine, snapPoint);
            if (nearest.properties.dist < minDist) {
              minDist = nearest.properties.dist;
              nearestSegment = { start: coords[i], end: coords[i + 1] };
            }
          }
          if (nearestSegment) {
            perpendicularMatch = calculatePerpendicularToLine(distanceOrigin, nearestSegment, lngLat);
          }
        }
      }

      // Determine which snap to use (priority: orthogonal > parallel > perpendicular > regular)
      let finalLngLat = lngLat;
      state.orthogonalSnapActive = false;
      state.parallelSnapActive = false;

      if (orthogonalMatch) {
        const destinationPoint = turf.destination(
          turf.point(distanceOrigin),
          mouseDistance,
          orthogonalMatch.bearing,
          { units: 'kilometers' }
        );
        finalLngLat = {
          lng: destinationPoint.geometry.coordinates[0],
          lat: destinationPoint.geometry.coordinates[1]
        };
        state.orthogonalSnapActive = true;
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

      } else if (parallelMatch) {
        const destinationPoint = turf.destination(
          turf.point(distanceOrigin),
          mouseDistance,
          parallelMatch.bearing,
          { units: 'kilometers' }
        );
        finalLngLat = {
          lng: destinationPoint.geometry.coordinates[0],
          lat: destinationPoint.geometry.coordinates[1]
        };
        state.parallelSnapActive = true;
        state.currentParallelMatch = parallelMatch;

        showParallelLineIndicator(this.map, distanceOrigin, parallelMatch.bearing);
        removeRightAngleIndicator(this.map);
        removeCollinearSnapLine(this.map);

      } else if (perpendicularMatch && perpendicularMatch.distanceFromCursor < 20) {
        finalLngLat = {
          lng: perpendicularMatch.coord[0],
          lat: perpendicularMatch.coord[1]
        };
        removeAllSnapIndicators(this.map);

      } else {
        finalLngLat = snappedCoord;
        removeAllSnapIndicators(this.map);
      }

      lngLat = finalLngLat;
      state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);

    } else {
      // Rail constraint is active (no distance/angle constraint)
      this.removeGuideCircle(state);
      state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);
    }
  } else {
    // Multiple vertices or feature dragging - remove guide circle
    this.removeGuideCircle(state);
    const delta = {
      lng: lngLat.lng - state.dragMoveLocation.lng,
      lat: lngLat.lat - state.dragMoveLocation.lat
    };

    if (state.selectedCoordPaths.length > 0) this.dragVertex(state, e, delta);
    else this.dragFeature(state, e, delta);
  }
  state.dragMoveLocation = lngLat;

  // Show movement vector from original grab position to current position
  if (state.dragMoveStartLocation) {
    showMovementVector(this.map, state.dragMoveStartLocation, lngLat);
  }

  // Show adjacent segment lengths when dragging a single vertex
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

