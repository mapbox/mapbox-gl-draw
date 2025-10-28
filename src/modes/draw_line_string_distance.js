import * as turf from '@turf/turf';
import * as Constants from '../constants.js';
import * as CommonSelectors from '../lib/common_selectors.js';
import doubleClickZoom from '../lib/double_click_zoom.js';
import {
  findNearestSegment,
  getUnderlyingLineBearing,
  getSnappedLineBearing,
  calculateCircleLineIntersection,
  calculateLineIntersection
} from '../lib/distance_mode_helpers.js';

const DrawLineStringDistance = {};

DrawLineStringDistance.onSetup = function(opts) {
  opts = opts || {};

  const line = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.LINE_STRING,
      coordinates: []
    }
  });

  this.addFeature(line);
  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.LINE);
  this.setActionableState({
    trash: true
  });

  const state = {
    line,
    currentVertexPosition: 0,
    currentDistance: null,
    distanceInput: null,
    vertices: [],
    guideCircle: null,
    currentPosition: null,
    lastPoint: null,
    inputEnabled: true,
    snapEnabled: true,
    snapPoints: [],
    snapTolerance: 20,
    snappedLineBearing: null,
    snappedLineSegment: null,
    labelDebounceTimer: null
  };

  this.createDistanceInput(state);

  return state;
};

DrawLineStringDistance.createDistanceInput = function(state) {
  // Create container
  const container = document.createElement('div');
  container.className = 'distance-mode-container';
  container.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(200, 200, 200, 0.8);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    pointer-events: auto;
    transition: opacity 0.2s ease-in-out;
  `;

  // Create label/state display
  const label = document.createElement('span');
  label.className = 'distance-mode-label';
  label.textContent = 'Press D for distance';
  label.style.cssText = `
    color: #666;
    font-size: 12px;
    white-space: nowrap;
    width: 120px;
    text-align: center;
    display: inline-block;
  `;

  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'distance (m)';
  input.className = 'distance-mode-input';
  input.style.cssText = `
    border: 1px solid rgba(200, 200, 200, 0.8);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    width: 120px;
    display: none;
    outline: none;
  `;

  // Create clear button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '×';
  clearBtn.className = 'distance-mode-clear';
  clearBtn.style.cssText = `
    border: none;
    background: none;
    color: #666;
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
    display: none;
  `;

  const updateDisplay = () => {
    if (state.currentDistance !== null && state.currentDistance > 0) {
      label.style.display = 'none';
      input.style.display = 'block';
      clearBtn.style.display = 'block';
    } else {
      label.style.display = 'block';
      input.style.display = 'none';
      clearBtn.style.display = 'none';
    }
  };

  input.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(parseFloat(value))) {
      state.currentDistance = value === '' ? null : parseFloat(value);
      updateDisplay();
      if (state.currentPosition) {
        this.onMouseMove(state, {
          point: state.lastPoint || { x: 0, y: 0 },
          lngLat: state.currentPosition
        });
      }
    } else {
      e.target.value = state.currentDistance !== null ? state.currentDistance.toString() : '';
    }
  });

  input.addEventListener('keydown', (e) => {
    // Only stop propagation for keys we're handling
    if (e.key === 'Enter' || e.key === 'Escape' || (e.key === 'Backspace' && e.target.value === '')) {
      e.stopPropagation();
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (state.vertices.length >= 2) {
        this.finishDrawing(state);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      state.currentDistance = null;
      input.value = '';
      input.blur();
      updateDisplay();
    } else if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault();
      this.onKeyUp(state, { keyCode: 8 });
    }
  });

  clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.currentDistance = null;
    input.value = '';
    input.blur();
    updateDisplay();
  });

  // Store reference to mode context for use in keyHandler
  const self = this;

  // Add keyboard shortcuts
  const keyHandler = (e) => {
    // 'D' key to toggle distance input
    if (e.key === 'd' || e.key === 'D') {
      if (state.vertices.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle: if distance is active, clear it; otherwise activate it
        if (state.currentDistance !== null || document.activeElement === input) {
          state.currentDistance = null;
          input.value = '';
          input.blur();
          updateDisplay();
        } else {
          input.style.display = 'block';
          label.style.display = 'none';
          input.focus();
        }
      }
    }
    // Backspace to remove last vertex (bypasses need for trash controls)
    else if (e.key === 'Backspace' && document.activeElement !== input) {
      e.preventDefault();
      e.stopPropagation();
      self.onTrash(state);
    }
  };
  document.addEventListener('keydown', keyHandler);

  container.appendChild(label);
  container.appendChild(input);
  container.appendChild(clearBtn);
  document.body.appendChild(container);

  state.distanceInput = input;
  state.distanceContainer = container;
  state.distanceKeyHandler = keyHandler;

  updateDisplay();
};


DrawLineStringDistance.onClick = function(state, e) {
  if (e.originalEvent && e.originalEvent.target === state.distanceInput) {
    return;
  }
  this.clickOnMap(state, e);
};

DrawLineStringDistance.getSnapInfo = function(lngLat) {
  const snapping = this._ctx.snapping;
  if (!snapping || !snapping.snappedGeometry) {
    return null;
  }

  const geom = snapping.snappedGeometry;
  const snapCoord = this._ctx.snapping.snapCoord(lngLat);

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

DrawLineStringDistance.getOrthogonalBearing = function(state, currentBearing, tolerance = 5) {
  if (!state.snapEnabled) {
    return null;
  }

  // Cache key based on state that affects orthogonal bearings
  const cacheKey = `${state.vertices.length}-${state.snappedLineBearing}-${Math.floor(currentBearing / tolerance) * tolerance}`;

  if (state.orthogonalBearingCache && state.orthogonalBearingCache.key === cacheKey) {
    return state.orthogonalBearingCache.result;
  }

  const orthogonalAngles = [0, 90, 180, 270];
  let bestMatch = null;
  let bestDiff = Infinity;

  // Check previous segment bearing (if we have 2+ vertices)
  if (state.vertices.length >= 2) {
    const lastVertex = state.vertices[state.vertices.length - 1];
    const secondLastVertex = state.vertices[state.vertices.length - 2];
    const from = turf.point(secondLastVertex);
    const to = turf.point(lastVertex);
    const lastSegmentBearing = turf.bearing(from, to);

    for (const angle of orthogonalAngles) {
      const orthogonalBearing = lastSegmentBearing + angle;
      const normalizedOrthogonal = ((orthogonalBearing % 360) + 360) % 360;
      const normalizedCurrent = ((currentBearing % 360) + 360) % 360;

      let diff = Math.abs(normalizedOrthogonal - normalizedCurrent);
      if (diff > 180) diff = 360 - diff;

      if (diff <= tolerance && diff < bestDiff) {
        bestDiff = diff;
        bestMatch = {
          bearing: orthogonalBearing,
          referenceBearing: lastSegmentBearing,
          referenceType: 'previous',
          referenceSegment: { start: secondLastVertex, end: lastVertex }
        };
      }
    }
  }

  // Check snapped line bearing (if we have a snapped line)
  // This includes underlying lines from points, which are stored in state when clicking
  if (state.snappedLineBearing !== null && state.vertices.length >= 1) {
    for (const angle of orthogonalAngles) {
      const orthogonalBearing = state.snappedLineBearing + angle;
      const normalizedOrthogonal = ((orthogonalBearing % 360) + 360) % 360;
      const normalizedCurrent = ((currentBearing % 360) + 360) % 360;

      let diff = Math.abs(normalizedOrthogonal - normalizedCurrent);
      if (diff > 180) diff = 360 - diff;

      if (diff <= tolerance && diff < bestDiff) {
        bestDiff = diff;
        bestMatch = {
          bearing: orthogonalBearing,
          referenceBearing: state.snappedLineBearing,
          referenceType: 'snapped',
          referenceSegment: state.snappedLineSegment
        };
      }
    }
  }

  // Cache the result
  state.orthogonalBearingCache = { key: cacheKey, result: bestMatch };

  return bestMatch;
};

DrawLineStringDistance.clickOnMap = function(state, e) {
  // First vertex - use existing snap functionality
  if (state.vertices.length === 0) {
    const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
    state.vertices.push([snappedCoord.lng, snappedCoord.lat]);
    state.line.updateCoordinate(0, snappedCoord.lng, snappedCoord.lat);

    // Store snapped line info if snapped to a line
    const snappedLineInfo = getSnappedLineBearing(this._ctx, snappedCoord);
    if (snappedLineInfo) {
      state.snappedLineBearing = snappedLineInfo.bearing;
      state.snappedLineSegment = snappedLineInfo.segment;
    }

    // If snapping to a point, check for underlying line at click location
    const underlyingLineInfo = getUnderlyingLineBearing(this._ctx, this.map, e, snappedCoord);
    if (underlyingLineInfo) {
      state.snappedLineBearing = underlyingLineInfo.bearing;
      state.snappedLineSegment = underlyingLineInfo.segment;
    }
    return;
  }

  // Subsequent vertices - apply new priority system
  let newVertex;
  const lastVertex = state.vertices[state.vertices.length - 1];
  const from = turf.point(lastVertex);
  const hasUserDistance = state.currentDistance !== null && state.currentDistance > 0;

  // Get snap info (point or line)
  const snapInfo = this.getSnapInfo(e.lngLat);

  // Calculate mouse bearing for orthogonal snap check
  const mouseBearing = turf.bearing(from, turf.point([e.lngLat.lng, e.lngLat.lat]));

  // Check for closing perpendicular snap (perpendicular to first segment)
  let closingPerpendicularSnap = null;
  if (state.vertices.length >= 3) {
    const firstVertex = state.vertices[0];
    const secondVertex = state.vertices[1];
    const firstSegmentBearing = turf.bearing(turf.point(firstVertex), turf.point(secondVertex));
    const bearingToFirst = turf.bearing(turf.point([e.lngLat.lng, e.lngLat.lat]), turf.point(firstVertex));

    // Check if bearing to first vertex is perpendicular to first segment (90° or 270°)
    for (const angle of [90, 270]) {
      const targetBearing = firstSegmentBearing + angle;
      const normalizedTarget = ((targetBearing % 360) + 360) % 360;
      const normalizedToFirst = ((bearingToFirst % 360) + 360) % 360;

      let diff = Math.abs(normalizedTarget - normalizedToFirst);
      if (diff > 180) diff = 360 - diff;

      if (diff <= 5) {
        closingPerpendicularSnap = {
          firstVertex: firstVertex,
          perpendicularBearing: targetBearing,
          firstSegmentBearing: firstSegmentBearing
        };
        break;
      }
    }
  }

  const orthogonalMatch = this.getOrthogonalBearing(state, mouseBearing);

  // Check if BOTH regular orthogonal AND closing perpendicular are active
  const bothSnapsActive = orthogonalMatch !== null && closingPerpendicularSnap !== null && !(snapInfo && snapInfo.type === 'point');

  // Determine direction (bearing) priority
  let bearingToUse = mouseBearing;
  let usePointDirection = false;
  let isOrthogonalSnap = false;
  let isClosingPerpendicularSnap = false;

  if (snapInfo && snapInfo.type === 'point') {
    // Priority 1: Point snap direction (highest priority for direction)
    bearingToUse = turf.bearing(from, turf.point(snapInfo.coord));
    usePointDirection = true;
  } else if (bothSnapsActive) {
    // Special case: Both orthogonal and closing perpendicular are active
    isOrthogonalSnap = true;
    isClosingPerpendicularSnap = true;
  } else if (orthogonalMatch !== null) {
    // Priority 2: Bearing snap (orthogonal/parallel to previous segment or snapped line)
    bearingToUse = orthogonalMatch.bearing;
    isOrthogonalSnap = true;
  } else if (closingPerpendicularSnap !== null) {
    // Priority 3: Closing perpendicular snap
    isClosingPerpendicularSnap = true;
  } else if (snapInfo && snapInfo.type === 'line') {
    // Priority 4: Line snap bearing (lowest priority for direction)
    bearingToUse = snapInfo.bearing;
  }

  // Determine length priority
  if (hasUserDistance) {
    // Priority 1 for length: User-entered distance
    // If we have a line snap, use circle-line intersection to find the correct point
    if (snapInfo && snapInfo.type === 'line') {
      const circleLineIntersection = calculateCircleLineIntersection(
        lastVertex,
        state.currentDistance,
        snapInfo.segment,
        [e.lngLat.lng, e.lngLat.lat]
      );
      if (circleLineIntersection) {
        newVertex = circleLineIntersection.coord;
      } else {
        // Fallback: if no intersection found, use bearing to create point at exact distance
        const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
        newVertex = destinationPoint.geometry.coordinates;
      }
    } else {
      // No line snap: use bearing to create point at exact distance
      const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else if (bothSnapsActive) {
    // Special case: Both orthogonal and closing perpendicular are active
    // Find intersection where both constraints are satisfied
    const perpLine = {
      start: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing + 180, { units: 'kilometers' }).geometry.coordinates,
      end: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing, { units: 'kilometers' }).geometry.coordinates
    };

    const intersection = calculateLineIntersection(lastVertex, orthogonalMatch.bearing, perpLine);
    if (intersection) {
      newVertex = intersection.coord;
    } else {
      // Fallback to mouse distance
      const mouseDistance = turf.distance(from, turf.point([e.lngLat.lng, e.lngLat.lat]), { units: 'kilometers' });
      const destinationPoint = turf.destination(from, mouseDistance, orthogonalMatch.bearing, { units: 'kilometers' });
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else if (closingPerpendicularSnap !== null && !usePointDirection && !isOrthogonalSnap) {
    // Closing perpendicular snap: find intersection where closing segment is perpendicular to first segment
    const perpLine = {
      start: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing + 180, { units: 'kilometers' }).geometry.coordinates,
      end: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing, { units: 'kilometers' }).geometry.coordinates
    };

    const intersection = calculateLineIntersection(lastVertex, mouseBearing, perpLine);
    if (intersection) {
      newVertex = intersection.coord;
    } else {
      // Fallback to mouse position
      const mouseDistance = turf.distance(from, turf.point([e.lngLat.lng, e.lngLat.lat]), { units: 'kilometers' });
      const destinationPoint = turf.destination(from, mouseDistance, mouseBearing, { units: 'kilometers' });
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else if (orthogonalMatch !== null && snapInfo && snapInfo.type === 'line') {
    // Priority 2 for length: Bearing snap + line nearby -> extend/shorten to intersection
    const intersection = calculateLineIntersection(lastVertex, bearingToUse, snapInfo.segment);
    if (intersection) {
      newVertex = intersection.coord;
    } else {
      // Fallback to mouse distance if intersection fails
      const mouseDistance = turf.distance(from, turf.point([e.lngLat.lng, e.lngLat.lat]), { units: 'kilometers' });
      const destinationPoint = turf.destination(from, mouseDistance, bearingToUse, { units: 'kilometers' });
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else if (usePointDirection && snapInfo) {
    // Point snap: use distance to point
    newVertex = snapInfo.coord;
  } else if (snapInfo && snapInfo.type === 'line') {
    // Line snap: use snapped position
    newVertex = snapInfo.coord;
  } else {
    // No snap: use mouse distance with bearing
    const mouseDistance = turf.distance(from, turf.point([e.lngLat.lng, e.lngLat.lat]), { units: 'kilometers' });
    const destinationPoint = turf.destination(from, mouseDistance, bearingToUse, { units: 'kilometers' });
    newVertex = destinationPoint.geometry.coordinates;
  }

  state.vertices.push(newVertex);
  state.line.updateCoordinate(state.vertices.length - 1, newVertex[0], newVertex[1]);

  // Store snapped line info if snapped to a line
  const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
  const snappedLineInfo = this.getSnappedLineBearing(snappedCoord);
  if (snappedLineInfo) {
    state.snappedLineBearing = snappedLineInfo.bearing;
    state.snappedLineSegment = snappedLineInfo.segment;
  } else {
    state.snappedLineBearing = null;
    state.snappedLineSegment = null;
  }

  // Clear distance input for next segment
  if (state.distanceInput) {
    state.distanceInput.value = '';
    state.currentDistance = null;
    state.distanceInput.focus();
  }
};

DrawLineStringDistance.onMouseMove = function(state, e) {
  const pointOnScreen = e.point;
  const lngLat = e.lngLat;

  state.currentPosition = lngLat;
  state.lastPoint = pointOnScreen;

  // Check for line snapping even before first vertex is placed
  if (state.vertices.length === 0) {
    const snapInfo = this.getSnapInfo(lngLat);
    if (snapInfo && snapInfo.type === 'line') {
      this.updateLineSegmentSplitLabels(state, snapInfo.segment, [lngLat.lng, lngLat.lat]);
    } else if (snapInfo && snapInfo.type === 'point') {
      // Check for underlying line at the point snap location
      const underlyingLineInfo = getUnderlyingLineBearing(this._ctx, this.map, e, { lng: snapInfo.coord[0], lat: snapInfo.coord[1] });
      if (underlyingLineInfo && underlyingLineInfo.segment) {
        this.updateLineSegmentSplitLabels(state, underlyingLineInfo.segment, snapInfo.coord);
      } else {
        this.removeLineSegmentSplitLabels(state);
      }
    } else {
      this.removeLineSegmentSplitLabels(state);
    }
    return;
  }

  // Calculate preview position using new priority system
  let previewVertex;
  const lastVertex = state.vertices[state.vertices.length - 1];
  const from = turf.point(lastVertex);
  const hasUserDistance = state.currentDistance !== null && state.currentDistance > 0;

  // Get snap info (point or line)
  const snapInfo = this.getSnapInfo(lngLat);

  // Calculate mouse bearing for orthogonal snap check
  const mouseBearing = turf.bearing(from, turf.point([lngLat.lng, lngLat.lat]));

  // Check for closing perpendicular snap: helps draw rectangles by making the closing
  // segment (from current position to first vertex) perpendicular to the first segment
  let closingPerpendicularSnap = null;
  if (state.vertices.length >= 3) {
    const firstVertex = state.vertices[0];
    const secondVertex = state.vertices[1];
    const firstSegmentBearing = turf.bearing(turf.point(firstVertex), turf.point(secondVertex));
    const bearingToFirst = turf.bearing(turf.point([lngLat.lng, lngLat.lat]), turf.point(firstVertex));

    // Check if bearing to first vertex is perpendicular to first segment (90° or 270°)
    for (const angle of [90, 270]) {
      const targetBearing = firstSegmentBearing + angle;
      const normalizedTarget = ((targetBearing % 360) + 360) % 360;
      const normalizedToFirst = ((bearingToFirst % 360) + 360) % 360;

      let diff = Math.abs(normalizedTarget - normalizedToFirst);
      if (diff > 180) diff = 360 - diff;

      if (diff <= 5) {
        closingPerpendicularSnap = {
          firstVertex: firstVertex,
          perpendicularBearing: targetBearing,
          firstSegmentBearing: firstSegmentBearing
        };
        break;
      }
    }
  }

  const orthogonalMatch = this.getOrthogonalBearing(state, mouseBearing);

  // Check if BOTH regular orthogonal AND closing perpendicular are active
  const bothSnapsActive = orthogonalMatch !== null && closingPerpendicularSnap !== null && !(snapInfo && snapInfo.type === 'point');

  // Determine direction (bearing) priority
  let bearingToUse = mouseBearing;
  let usePointDirection = false;
  let isOrthogonalSnap = false;
  let isClosingPerpendicularSnap = false;

  if (snapInfo && snapInfo.type === 'point') {
    // Priority 1: Point snap direction (highest priority for direction)
    bearingToUse = turf.bearing(from, turf.point(snapInfo.coord));
    usePointDirection = true;
  } else if (bothSnapsActive) {
    // Special case: Both orthogonal and closing perpendicular are active
    // We'll handle this in the length priority section
    isOrthogonalSnap = true;
    isClosingPerpendicularSnap = true;
  } else if (orthogonalMatch !== null) {
    // Priority 2: Bearing snap (orthogonal/parallel to previous segment or snapped line)
    bearingToUse = orthogonalMatch.bearing;
    isOrthogonalSnap = true;
  } else if (closingPerpendicularSnap !== null) {
    // Priority 3: Closing perpendicular snap
    // (This will be handled in the length priority section)
    isClosingPerpendicularSnap = true;
  } else if (snapInfo && snapInfo.type === 'line') {
    // Priority 4: Line snap bearing (lowest priority for direction)
    bearingToUse = snapInfo.bearing;
  }

  // Determine length priority
  if (hasUserDistance) {
    // Priority 1 for length: User-entered distance
    // If we have a line snap, use circle-line intersection to find the correct point
    if (snapInfo && snapInfo.type === 'line') {
      const circleLineIntersection = calculateCircleLineIntersection(
        lastVertex,
        state.currentDistance,
        snapInfo.segment,
        [lngLat.lng, lngLat.lat]
      );
      if (circleLineIntersection) {
        previewVertex = circleLineIntersection.coord;
      } else {
        // Fallback: if no intersection found, use bearing to create point at exact distance
        const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
        previewVertex = destinationPoint.geometry.coordinates;
      }
    } else {
      // No line snap: use bearing to create point at exact distance
      const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.updateGuideCircle(state, lastVertex, state.currentDistance);
  } else if (bothSnapsActive) {
    // Special case: Both orthogonal and closing perpendicular are active
    // Find intersection where both constraints are satisfied
    const perpLine = {
      start: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing + 180, { units: 'kilometers' }).geometry.coordinates,
      end: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing, { units: 'kilometers' }).geometry.coordinates
    };

    const intersection = calculateLineIntersection(lastVertex, orthogonalMatch.bearing, perpLine);
    if (intersection) {
      previewVertex = intersection.coord;
      // Show both indicators (regular at last vertex, closing at first vertex)
      this.updateRightAngleIndicator(state, lastVertex, orthogonalMatch.referenceBearing, orthogonalMatch.bearing, orthogonalMatch.referenceSegment);
      const closingBearing = turf.bearing(turf.point(previewVertex), turf.point(closingPerpendicularSnap.firstVertex));
      const firstSegment = { start: state.vertices[0], end: state.vertices[1] };
      this.updateClosingRightAngleIndicator(
        state,
        closingPerpendicularSnap.firstVertex,
        closingPerpendicularSnap.firstSegmentBearing,
        closingBearing,
        firstSegment
      );
    } else {
      // Fallback to mouse distance
      const mouseDistance = turf.distance(from, turf.point([lngLat.lng, lngLat.lat]), { units: 'kilometers' });
      const destinationPoint = turf.destination(from, mouseDistance, orthogonalMatch.bearing, { units: 'kilometers' });
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.removeGuideCircle(state);
  } else if (closingPerpendicularSnap !== null && !usePointDirection && !isOrthogonalSnap) {
    // Closing perpendicular snap: find intersection where closing segment is perpendicular to first segment
    const perpLine = {
      start: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing + 180, { units: 'kilometers' }).geometry.coordinates,
      end: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing, { units: 'kilometers' }).geometry.coordinates
    };

    const intersection = calculateLineIntersection(lastVertex, mouseBearing, perpLine);
    if (intersection) {
      previewVertex = intersection.coord;
      isClosingPerpendicularSnap = true;
      // Show right-angle indicator at first vertex
      const closingBearing = turf.bearing(turf.point(previewVertex), turf.point(closingPerpendicularSnap.firstVertex));
      const firstSegment = { start: state.vertices[0], end: state.vertices[1] };
      this.updateClosingRightAngleIndicator(
        state,
        closingPerpendicularSnap.firstVertex,
        closingPerpendicularSnap.firstSegmentBearing,
        closingBearing,
        firstSegment
      );
    } else {
      // Fallback to mouse distance
      const mouseDistance = turf.distance(from, turf.point([lngLat.lng, lngLat.lat]), { units: 'kilometers' });
      const destinationPoint = turf.destination(from, mouseDistance, bearingToUse, { units: 'kilometers' });
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.removeGuideCircle(state);
  } else if (orthogonalMatch !== null && snapInfo && snapInfo.type === 'line') {
    // Priority 2 for length: Bearing snap + line nearby -> extend/shorten to intersection
    const intersection = calculateLineIntersection(lastVertex, bearingToUse, snapInfo.segment);
    if (intersection) {
      previewVertex = intersection.coord;
    } else {
      // Fallback to mouse distance if intersection fails
      const mouseDistance = turf.distance(from, turf.point([lngLat.lng, lngLat.lat]), { units: 'kilometers' });
      const destinationPoint = turf.destination(from, mouseDistance, bearingToUse, { units: 'kilometers' });
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.removeGuideCircle(state);
  } else if (usePointDirection && snapInfo) {
    // Point snap: use distance to point
    previewVertex = snapInfo.coord;
    this.removeGuideCircle(state);
  } else if (snapInfo && snapInfo.type === 'line') {
    // Line snap: use snapped position
    previewVertex = snapInfo.coord;
    this.removeGuideCircle(state);
  } else {
    // No snap: use mouse distance with bearing
    const mouseDistance = turf.distance(from, turf.point([lngLat.lng, lngLat.lat]), { units: 'kilometers' });
    const destinationPoint = turf.destination(from, mouseDistance, bearingToUse, { units: 'kilometers' });
    previewVertex = destinationPoint.geometry.coordinates;
    this.removeGuideCircle(state);
  }

  // Show right-angle indicators based on snap state
  // Note: bothSnapsActive case already handles showing both indicators above
  if (isOrthogonalSnap && !usePointDirection && orthogonalMatch && !bothSnapsActive) {
    this.updateRightAngleIndicator(state, lastVertex, orthogonalMatch.referenceBearing, bearingToUse, orthogonalMatch.referenceSegment);
  } else if (!isClosingPerpendicularSnap && !bothSnapsActive) {
    this.removeRightAngleIndicator(state);
  }

  // Handle closing indicator separately
  if (!isClosingPerpendicularSnap && !bothSnapsActive) {
    this.removeClosingRightAngleIndicator(state);
  }

  // Calculate actual distance to preview vertex (accounts for all snapping)
  const actualDistance = turf.distance(from, turf.point(previewVertex), { units: 'meters' });

  // Update distance label
  this.updateDistanceLabel(state, lastVertex, previewVertex, actualDistance);

  // Update line segment split labels if snapping to a line
  if (snapInfo && snapInfo.type === 'line') {
    this.updateLineSegmentSplitLabels(state, snapInfo.segment, [lngLat.lng, lngLat.lat]);
  } else if (snapInfo && snapInfo.type === 'point') {
    // Check for underlying line at the point snap location
    const underlyingLineInfo = getUnderlyingLineBearing(this._ctx, this.map, e, { lng: snapInfo.coord[0], lat: snapInfo.coord[1] });
    if (underlyingLineInfo && underlyingLineInfo.segment) {
      this.updateLineSegmentSplitLabels(state, underlyingLineInfo.segment, snapInfo.coord);
    } else {
      this.removeLineSegmentSplitLabels(state);
    }
  } else {
    this.removeLineSegmentSplitLabels(state);
  }

  // Update preview point indicator
  this.updatePreviewPoint(state, previewVertex);

  // Update line preview
  state.line.updateCoordinate(state.vertices.length, previewVertex[0], previewVertex[1]);
};

DrawLineStringDistance.updateDistanceLabel = function(state, startVertex, endVertex, distance) {
  const map = this.map;
  if (!map) return;

  // Format distance to 1 decimal place
  const distanceText = `${distance.toFixed(1)}m`;

  // Calculate midpoint of the segment
  const start = turf.point(startVertex);
  const end = turf.point(endVertex);
  const midpoint = turf.midpoint(start, end);

  // Calculate bearing for rotation
  const bearing = turf.bearing(start, end);

  // Calculate text rotation (perpendicular to line)
  let rotation = bearing - 90;
  // Normalize to 0-360
  rotation = ((rotation % 360) + 360) % 360;
  // If upside down (between 90° and 270°), flip it 180°
  if (rotation > 90 && rotation < 270) {
    rotation = (rotation + 180) % 360;
  }

  // Offset the label position above the line (perpendicular to bearing)
  // Use 3m offset above the line (increased from 1.5m to ensure it's clearly above)
  const offsetDistance = 3 / 1000; // Convert to km for turf
  const perpendicularBearing = bearing - 90; // 90 degrees perpendicular to the LEFT (above when rotated)
  const offsetMidpoint = turf.destination(midpoint, offsetDistance, perpendicularBearing, { units: 'kilometers' });

  // Create a feature for the text label at the offset midpoint
  const labelFeature = {
    type: 'Feature',
    properties: {
      distanceLabel: true,
      distance: distanceText,
      rotation: rotation
    },
    geometry: {
      type: 'Point',
      coordinates: offsetMidpoint.geometry.coordinates
    }
  };

  // Wrap in FeatureCollection to ensure proper rendering
  const labelFeatureCollection = {
    type: 'FeatureCollection',
    features: [labelFeature]
  };

  // Update or create the text label layer
  if (!map.getSource('distance-label-text')) {
    map.addSource('distance-label-text', {
      type: 'geojson',
      data: labelFeatureCollection
    });

    map.addLayer({
      id: 'distance-label-text',
      type: 'symbol',
      source: 'distance-label-text',
      layout: {
        'text-field': ['get', 'distance'],
        'text-size': 10,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 0],
        'text-anchor': 'center',
        'text-rotate': ['get', 'rotation'],
        'text-rotation-alignment': 'map',
        'text-pitch-alignment': 'map',
        'text-allow-overlap': true,
        'text-ignore-placement': true
      },
      paint: {
        'text-color': '#000000',
        'text-opacity': 1
      }
    });
  } else {
    map.getSource('distance-label-text').setData(labelFeatureCollection);
  }
};

DrawLineStringDistance.removeDistanceLabel = function(state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('distance-label-text')) {
    map.removeLayer('distance-label-text');
  }
  if (map.getSource && map.getSource('distance-label-text')) {
    map.removeSource('distance-label-text');
  }
};

DrawLineStringDistance.updateLineSegmentSplitLabels = function(state, segment, snapPoint) {
  const map = this.map;
  if (!map) return;

  const snappedCoord = this._ctx.snapping.snapCoord({ lng: snapPoint[0], lat: snapPoint[1] });
  const snapCoord = [snappedCoord.lng, snappedCoord.lat];

  // Calculate distances for the two sub-segments
  const distance1 = turf.distance(turf.point(segment.start), turf.point(snapCoord), { units: 'meters' });
  const distance2 = turf.distance(turf.point(snapCoord), turf.point(segment.end), { units: 'meters' });

  const labelFeatures = [];

  // First sub-segment label (start to snap point)
  if (distance1 > 0.1) { // Only show if distance is meaningful
    const distanceText1 = `${distance1.toFixed(1)}m`;
    const midpoint1 = turf.midpoint(turf.point(segment.start), turf.point(snapCoord));
    const bearing1 = turf.bearing(turf.point(segment.start), turf.point(snapCoord));

    // Calculate rotation and flip if upside down
    let rotation1 = bearing1 - 90;
    rotation1 = ((rotation1 % 360) + 360) % 360;
    if (rotation1 > 90 && rotation1 < 270) {
      rotation1 = (rotation1 + 180) % 360;
    }

    const offsetDistance = 3 / 1000;
    const perpendicularBearing1 = bearing1 - 90;
    const offsetMidpoint1 = turf.destination(midpoint1, offsetDistance, perpendicularBearing1, { units: 'kilometers' });

    labelFeatures.push({
      type: 'Feature',
      properties: {
        distanceLabel: true,
        distance: distanceText1,
        rotation: rotation1
      },
      geometry: {
        type: 'Point',
        coordinates: offsetMidpoint1.geometry.coordinates
      }
    });
  }

  // Second sub-segment label (snap point to end)
  if (distance2 > 0.1) { // Only show if distance is meaningful
    const distanceText2 = `${distance2.toFixed(1)}m`;
    const midpoint2 = turf.midpoint(turf.point(snapCoord), turf.point(segment.end));
    const bearing2 = turf.bearing(turf.point(snapCoord), turf.point(segment.end));

    // Calculate rotation and flip if upside down
    let rotation2 = bearing2 - 90;
    rotation2 = ((rotation2 % 360) + 360) % 360;
    if (rotation2 > 90 && rotation2 < 270) {
      rotation2 = (rotation2 + 180) % 360;
    }

    const offsetDistance = 3 / 1000;
    const perpendicularBearing2 = bearing2 - 90;
    const offsetMidpoint2 = turf.destination(midpoint2, offsetDistance, perpendicularBearing2, { units: 'kilometers' });

    labelFeatures.push({
      type: 'Feature',
      properties: {
        distanceLabel: true,
        distance: distanceText2,
        rotation: rotation2
      },
      geometry: {
        type: 'Point',
        coordinates: offsetMidpoint2.geometry.coordinates
      }
    });
  }

  const labelFeatureCollection = {
    type: 'FeatureCollection',
    features: labelFeatures
  };

  if (!map.getSource('line-segment-split-labels')) {
    map.addSource('line-segment-split-labels', {
      type: 'geojson',
      data: labelFeatureCollection
    });

    map.addLayer({
      id: 'line-segment-split-labels',
      type: 'symbol',
      source: 'line-segment-split-labels',
      layout: {
        'text-field': ['get', 'distance'],
        'text-size': 10,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 0],
        'text-anchor': 'center',
        'text-rotate': ['get', 'rotation'],
        'text-rotation-alignment': 'map',
        'text-pitch-alignment': 'map',
        'text-allow-overlap': true,
        'text-ignore-placement': true
      },
      paint: {
        'text-color': '#666666',
        'text-opacity': 0.8
      }
    });
  } else {
    map.getSource('line-segment-split-labels').setData(labelFeatureCollection);
  }
};

DrawLineStringDistance.removeLineSegmentSplitLabels = function(state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('line-segment-split-labels')) {
    map.removeLayer('line-segment-split-labels');
  }
  if (map.getSource && map.getSource('line-segment-split-labels')) {
    map.removeSource('line-segment-split-labels');
  }
};

DrawLineStringDistance.updatePreviewPoint = function(state, coordinates) {
  const map = this.map;
  if (!map) return;

  const previewPointFeature = {
    type: 'Feature',
    properties: { isPreviewPoint: true },
    geometry: {
      type: 'Point',
      coordinates: coordinates
    }
  };

  if (!map.getSource('preview-point-indicator')) {
    map.addSource('preview-point-indicator', {
      type: 'geojson',
      data: previewPointFeature
    });

    map.addLayer({
      id: 'preview-point-indicator',
      type: 'circle',
      source: 'preview-point-indicator',
      paint: {
        'circle-radius': 2,
        'circle-color': '#000000',
        'circle-opacity': 1
      }
    });
  } else {
    map.getSource('preview-point-indicator').setData(previewPointFeature);
  }
};

DrawLineStringDistance.removePreviewPoint = function(state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('preview-point-indicator')) {
    map.removeLayer('preview-point-indicator');
  }
  if (map.getSource && map.getSource('preview-point-indicator')) {
    map.removeSource('preview-point-indicator');
  }
};

DrawLineStringDistance.updateGuideCircle = function(state, center, radius) {
  // Check if we can reuse the existing circle (optimization)
  if (state.guideCircle &&
      state.guideCircleRadius === radius &&
      state.guideCircleCenter &&
      state.guideCircleCenter[0] === center[0] &&
      state.guideCircleCenter[1] === center[1]) {
    return; // No need to regenerate
  }

  const steps = 64;
  const circleCoords = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 360;
    const pt = turf.destination(turf.point(center), radius / 1000, angle, { units: 'kilometers' });
    circleCoords.push(pt.geometry.coordinates);
  }

  const circleFeature = {
    type: 'Feature',
    properties: { isGuideCircle: true },
    geometry: {
      type: 'LineString',
      coordinates: circleCoords
    }
  };

  state.guideCircle = circleFeature;
  state.guideCircleRadius = radius;
  state.guideCircleCenter = center;

  const map = this.map;
  if (!map) return;

  if (!map.getSource('distance-guide-circle')) {
    map.addSource('distance-guide-circle', {
      type: 'geojson',
      data: circleFeature
    });

    map.addLayer({
      id: 'distance-guide-circle',
      type: 'line',
      source: 'distance-guide-circle',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 0.2,
        'line-dasharray': [2, 2]
      }
    });
  } else {
    map.getSource('distance-guide-circle').setData(circleFeature);
  }
};

DrawLineStringDistance.removeGuideCircle = function(state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('distance-guide-circle')) {
    map.removeLayer('distance-guide-circle');
  }
  if (map.getSource && map.getSource('distance-guide-circle')) {
    map.removeSource('distance-guide-circle');
  }
  state.guideCircle = null;
};

DrawLineStringDistance.updateRightAngleIndicator = function(state, cornerVertex, referenceBearing, nextBearing, referenceSegment, flipInside = false) {
  // Create L-shaped indicator that forms a square with the two line segments
  const cornerPoint = turf.point(cornerVertex);

  // For regular orthogonal snap: indicator on outside (back along reference, forward along next)
  // For closing perpendicular: indicator on inside (forward along reference, back along next)
  const refOffset = flipInside ? 0 : 180;
  const nextOffset = flipInside ? 180 : 0;

  // Point 1: along reference segment
  const point1 = turf.destination(cornerPoint, 2 / 1000, referenceBearing + refOffset, { units: 'kilometers' });

  // Point 2: The diagonal corner of the square
  const point2 = turf.destination(turf.point(point1.geometry.coordinates), 2 / 1000, nextBearing + nextOffset, { units: 'kilometers' });

  // Point 3: along next segment
  const point3 = turf.destination(cornerPoint, 2 / 1000, nextBearing + nextOffset, { units: 'kilometers' });

  const indicatorFeature = {
    type: 'Feature',
    properties: { isRightAngleIndicator: true },
    geometry: {
      type: 'LineString',
      coordinates: [point1.geometry.coordinates, point2.geometry.coordinates, point3.geometry.coordinates]
    }
  };

  state.rightAngleIndicator = indicatorFeature;

  const map = this.map;
  if (!map) return;

  if (!map.getSource('right-angle-indicator')) {
    map.addSource('right-angle-indicator', {
      type: 'geojson',
      data: indicatorFeature
    });

    map.addLayer({
      id: 'right-angle-indicator',
      type: 'line',
      source: 'right-angle-indicator',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 1.0
      }
    });
  } else {
    map.getSource('right-angle-indicator').setData(indicatorFeature);
  }
};

DrawLineStringDistance.removeRightAngleIndicator = function(state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('right-angle-indicator')) {
    map.removeLayer('right-angle-indicator');
  }
  if (map.getSource && map.getSource('right-angle-indicator')) {
    map.removeSource('right-angle-indicator');
  }
  state.rightAngleIndicator = null;
};

DrawLineStringDistance.updateClosingRightAngleIndicator = function(state, cornerVertex, referenceBearing, nextBearing, referenceSegment) {
  // Create L-shaped indicator for closing perpendicular (always inside)
  const cornerPoint = turf.point(cornerVertex);

  // For closing perpendicular: indicator on inside (forward along reference, back along next)
  const point1 = turf.destination(cornerPoint, 2 / 1000, referenceBearing, { units: 'kilometers' });
  const point2 = turf.destination(turf.point(point1.geometry.coordinates), 2 / 1000, nextBearing + 180, { units: 'kilometers' });
  const point3 = turf.destination(cornerPoint, 2 / 1000, nextBearing + 180, { units: 'kilometers' });

  const indicatorFeature = {
    type: 'Feature',
    properties: { isClosingRightAngleIndicator: true },
    geometry: {
      type: 'LineString',
      coordinates: [point1.geometry.coordinates, point2.geometry.coordinates, point3.geometry.coordinates]
    }
  };

  state.closingRightAngleIndicator = indicatorFeature;

  const map = this.map;
  if (!map) return;

  if (!map.getSource('right-angle-indicator-closing')) {
    map.addSource('right-angle-indicator-closing', {
      type: 'geojson',
      data: indicatorFeature
    });

    map.addLayer({
      id: 'right-angle-indicator-closing',
      type: 'line',
      source: 'right-angle-indicator-closing',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 1.0
      }
    });
  } else {
    map.getSource('right-angle-indicator-closing').setData(indicatorFeature);
  }
};

DrawLineStringDistance.removeClosingRightAngleIndicator = function(state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('right-angle-indicator-closing')) {
    map.removeLayer('right-angle-indicator-closing');
  }
  if (map.getSource && map.getSource('right-angle-indicator-closing')) {
    map.removeSource('right-angle-indicator-closing');
  }
  state.closingRightAngleIndicator = null;
};

DrawLineStringDistance.onKeyUp = function(state, e) {
  // Tab key
  if (e.keyCode === 9) {
    if (state.vertices.length === 0) return;

    if (!state.inputEnabled) {
      state.snapEnabled = true;
      state.inputEnabled = true;
      state.currentDistance = null;
      if (state.distanceInput) {
        state.distanceInput.value = '';
        state.distanceInput.style.display = 'block';
        setTimeout(() => state.distanceInput.focus(), 10);
      }
      this.removeGuideCircle(state);
    }
    return;
  }

  // Enter key
  if (e.keyCode === 13 || CommonSelectors.isEnterKey(e)) {
    if (state.vertices.length >= 2) {
      this.finishDrawing(state);
    }
  }

  // Escape key
  if (e.keyCode === 27 || CommonSelectors.isEscapeKey(e)) {
    if (state.vertices.length >= 2) {
      this.finishDrawing(state);
    } else {
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  }

  // Backspace
  if (e.keyCode === 8) {
    if (state.distanceInput && state.distanceInput.value !== '') {
      return;
    }

    if (state.vertices.length > 1) {
      state.vertices.pop();
      state.line.removeCoordinate(state.vertices.length);
    } else if (state.vertices.length === 1) {
      state.vertices.pop();
      state.line.setCoordinates([]);
    }
  }
};

DrawLineStringDistance.finishDrawing = function(state) {
  if (state.vertices.length < 2) {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
    return;
  }

  state.line.setCoordinates(state.vertices);

  // Clean up indicators before finishing
  this.removeGuideCircle(state);
  this.removeRightAngleIndicator(state);
  this.removeClosingRightAngleIndicator(state);
  this.removeLineSegmentSplitLabels(state);
  this.removePreviewPoint(state);

  this.fire(Constants.events.CREATE, {
    features: [state.line.toGeoJSON()]
  });

  this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.line.id]
  });
};

DrawLineStringDistance.onStop = function(state) {
  doubleClickZoom.enable(this);
  this.activateUIButton();
  this.removeGuideCircle(state);
  this.removeDistanceLabel(state);
  this.removeLineSegmentSplitLabels(state);
  this.removePreviewPoint(state);

  if (state.distanceContainer) {
    state.distanceContainer.remove();
    state.distanceContainer = null;
  }

  if (state.distanceKeyHandler) {
    document.removeEventListener('keydown', state.distanceKeyHandler);
    state.distanceKeyHandler = null;
  }

  state.distanceInput = null;

  if (this.getFeature(state.line.id) === undefined) return;

  if (state.vertices.length < 2) {
    this.deleteFeature([state.line.id], { silent: true });
  }
};

DrawLineStringDistance.onTrash = function(state) {
  // Remove the last drawn vertex instead of deleting the entire feature
  if (state.vertices.length > 1) {
    state.vertices.pop();
    state.line.removeCoordinate(state.vertices.length);

    // Also remove the preview coordinate
    if (state.line.coordinates.length > state.vertices.length) {
      state.line.removeCoordinate(state.vertices.length);
    }

    // If we have the last mouse position, regenerate the preview
    if (state.currentPosition) {
      this.onMouseMove(state, {
        point: state.lastPoint || { x: 0, y: 0 },
        lngLat: state.currentPosition
      });
    }

    // Force an immediate render through the store
    if (this._ctx && this._ctx.store && this._ctx.store.render) {
      this._ctx.store.render();
    }
  } else {
    // If only one or zero vertices, delete the feature and exit
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }
};

DrawLineStringDistance.toDisplayFeatures = function(state, geojson, display) {
  const isActiveLine = geojson.properties.id === state.line.id;
  geojson.properties.active = isActiveLine ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;

  if (!isActiveLine) return display(geojson);

  // Display vertices
  if (state.vertices.length > 0) {
    state.vertices.forEach((vertex, index) => {
      display({
        type: 'Feature',
        properties: {
          meta: Constants.meta.VERTEX,
          parent: state.line.id,
          coord_path: String(index),
          active: index === state.vertices.length - 1 ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE
        },
        geometry: {
          type: 'Point',
          coordinates: vertex
        }
      });
    });
  }

  display(geojson);
};

DrawLineStringDistance.onTap = DrawLineStringDistance.onClick;

export default DrawLineStringDistance;
