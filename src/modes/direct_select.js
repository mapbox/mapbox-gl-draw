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
  calculatePerpendicularToLine
} from '../lib/distance_mode_helpers.js';
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

  state.dragMoving = false;
  state.canDragMove = false;
  state.dragMoveLocation = null;
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
    currentParallelMatch: null
  };

  this.setSelected(featureId);
  this.setSelectedCoordinates(this.pathsToCoordinates(featureId, state.selectedCoordPaths));
  doubleClickZoom.disable(this);

  this.setActionableState({
    trash: true
  });

  return state;
};

DirectSelect.onStop = function() {
  doubleClickZoom.enable(this);
  this.clearSelectedCoordinates();
  // Clean up visualizations on mode exit
  removeMovementVector(this.map);
  removeRailIndicator(this.map);
  removeAllSnapIndicators(this.map);
  removeAdjacentSegmentLengths(this.map);
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

    // Shift key bypasses all snapping
    if (shiftHeld) {
      removeAllSnapIndicators(this.map);
      state.orthogonalSnapActive = false;
      state.parallelSnapActive = false;
      state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);
    } else if (!state.railConstraintActive) {
      // Enhanced snapping when not using rail constraint

      // Get the current vertex position (drag start)
      const startVertex = [state.dragMoveStartLocation.lng, state.dragMoveStartLocation.lat];

      // Calculate mouse bearing from start to current
      const mouseBearing = turf.bearing(
        turf.point(startVertex),
        turf.point([lngLat.lng, lngLat.lat])
      );

      // Calculate mouse distance
      const mouseDistance = turf.distance(
        turf.point(startVertex),
        turf.point([lngLat.lng, lngLat.lat]),
        { units: 'kilometers' }
      );

      // Get orthogonal snap tolerance from options (default 5 degrees)
      const orthogonalTolerance = this._ctx.options.orthogonalSnapTolerance || 5;
      const parallelTolerance = this._ctx.options.parallelSnapTolerance || 5;

      // Check for orthogonal snap to adjacent segments
      let orthogonalMatch = null;
      if (state.adjacentSegments && state.adjacentSegments.length > 0) {
        orthogonalMatch = getOrthogonalSnapBearing(state.adjacentSegments, mouseBearing, orthogonalTolerance);
      }

      // Check for parallel snap to nearby lines
      let parallelMatch = null;
      const nearbyLines = findNearbyParallelLines(this._ctx, this.map, startVertex, lngLat);
      if (nearbyLines && nearbyLines.length > 0) {
        parallelMatch = getParallelBearing(nearbyLines, mouseBearing, parallelTolerance);
      }

      // Check for perpendicular-to-line snap
      let perpendicularMatch = null;
      const snappedCoord = this._ctx.snapping.snapCoord(lngLat);
      const snapInfo = this._ctx.snapping.snappedFeature;
      if (snapInfo && snapInfo.geometry && (snapInfo.geometry.type === 'LineString' || snapInfo.geometry.type === 'Polygon')) {
        // Get the line segment
        let coords = snapInfo.geometry.coordinates;
        if (snapInfo.geometry.type === 'Polygon') {
          coords = coords[0];
        }
        if (coords.length >= 2) {
          // Find nearest segment
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
            perpendicularMatch = calculatePerpendicularToLine(startVertex, nearestSegment, lngLat);
          }
        }
      }

      // Determine which snap to use (priority: orthogonal > parallel > perpendicular > regular)
      let finalLngLat = lngLat;
      state.orthogonalSnapActive = false;
      state.parallelSnapActive = false;

      if (orthogonalMatch) {
        // Apply orthogonal snap
        const destinationPoint = turf.destination(
          turf.point(startVertex),
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

        // Show appropriate indicator
        const isCollinear = orthogonalMatch.angleFromReference === 0 || orthogonalMatch.angleFromReference === 180;
        if (isCollinear) {
          showCollinearSnapLine(this.map, startVertex, orthogonalMatch.referenceBearing);
          removeRightAngleIndicator(this.map);
        } else {
          showRightAngleIndicator(
            this.map,
            startVertex,
            orthogonalMatch.referenceBearing,
            orthogonalMatch.bearing
          );
          removeCollinearSnapLine(this.map);
        }
        removeParallelLineIndicator(this.map);

      } else if (parallelMatch) {
        // Apply parallel snap
        const destinationPoint = turf.destination(
          turf.point(startVertex),
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

        // Show parallel indicator
        showParallelLineIndicator(this.map, startVertex, parallelMatch.bearing);
        removeRightAngleIndicator(this.map);
        removeCollinearSnapLine(this.map);

      } else if (perpendicularMatch && perpendicularMatch.distanceFromCursor < 20) {
        // Apply perpendicular snap if close enough (within 20 meters)
        finalLngLat = {
          lng: perpendicularMatch.coord[0],
          lat: perpendicularMatch.coord[1]
        };
        removeAllSnapIndicators(this.map);

      } else {
        // Regular point/line snapping
        finalLngLat = snappedCoord;
        removeAllSnapIndicators(this.map);
      }

      lngLat = finalLngLat;
      state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);
    } else {
      // Rail constraint is active
      state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);
    }
  } else {
    // Multiple vertices or feature dragging
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

