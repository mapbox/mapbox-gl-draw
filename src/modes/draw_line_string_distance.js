import * as turf from '@turf/turf';
import * as CommonSelectors from '../lib/common_selectors.js';
import doubleClickZoom from '../lib/double_click_zoom.js';
import * as Constants from '../constants.js';

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
    snappedLineSegment: null
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
    e.stopPropagation();

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

  // Add keyboard shortcut for 'D' key to toggle
  const keyHandler = (e) => {
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

    // Find the nearest segment
    let nearestSegment = null;
    let minDistance = Infinity;

    for (let i = 0; i < coords.length - 1; i++) {
      const segmentStart = coords[i];
      const segmentEnd = coords[i + 1];
      const segment = turf.lineString([segmentStart, segmentEnd]);
      const nearestPoint = turf.nearestPointOnLine(segment, snapPoint);
      const distance = turf.distance(snapPoint, nearestPoint, { units: 'meters' });

      if (distance < minDistance) {
        minDistance = distance;
        nearestSegment = { start: segmentStart, end: segmentEnd };
      }
    }

    if (nearestSegment) {
      const bearing = turf.bearing(
        turf.point(nearestSegment.start),
        turf.point(nearestSegment.end)
      );
      return {
        type: 'line',
        coord: [snapCoord.lng, snapCoord.lat],
        bearing: bearing,
        segment: nearestSegment,
        snappedFeature: snapping.snappedFeature
      };
    }
  }

  return null;
};

DrawLineStringDistance.getSnappedLineBearing = function(snappedCoord) {
  // Get the snapping system to find which line was snapped to
  const snapping = this._ctx.snapping;
  if (!snapping || !snapping.snappedGeometry) {
    return null;
  }

  const geom = snapping.snappedGeometry;

  // Only process LineString or MultiLineString
  if (geom.type !== 'LineString' && geom.type !== 'MultiLineString') {
    return null;
  }

  const snapPoint = turf.point([snappedCoord.lng, snappedCoord.lat]);
  const line = geom.type === 'LineString' ? geom : turf.lineString(geom.coordinates.flat());

  // Find the nearest segment
  let nearestSegment = null;
  let minDistance = Infinity;

  const coords = geom.type === 'LineString' ? geom.coordinates : geom.coordinates.flat();

  for (let i = 0; i < coords.length - 1; i++) {
    const segmentStart = coords[i];
    const segmentEnd = coords[i + 1];
    const segment = turf.lineString([segmentStart, segmentEnd]);
    const nearestPoint = turf.nearestPointOnLine(segment, snapPoint);
    const distance = turf.distance(snapPoint, nearestPoint, { units: 'meters' });

    if (distance < minDistance) {
      minDistance = distance;
      nearestSegment = { start: segmentStart, end: segmentEnd };
    }
  }

  if (nearestSegment) {
    const bearing = turf.bearing(
      turf.point(nearestSegment.start),
      turf.point(nearestSegment.end)
    );
    return { bearing, segment: nearestSegment };
  }

  return null;
};

DrawLineStringDistance.calculateLineIntersection = function(startPoint, bearing, lineSegment) {
  // Calculate where the bearing line from startPoint intersects with lineSegment (extended to infinity)
  // Returns null if lines are parallel or intersection distance is unreasonable

  const p1 = turf.point(startPoint);
  const lineStart = turf.point(lineSegment.start);
  const lineEnd = turf.point(lineSegment.end);

  const lineBearing = turf.bearing(lineStart, lineEnd);

  console.log('calculateLineIntersection:', {
    bearing: bearing,
    lineBearing: lineBearing,
    startPoint: startPoint,
    lineSegment: lineSegment
  });

  // Check if lines are nearly parallel (within 5 degrees)
  let angleDiff = Math.abs(bearing - lineBearing);
  if (angleDiff > 180) angleDiff = Math.abs(360 - angleDiff);
  console.log('angleDiff:', angleDiff);
  if (angleDiff < 5 || angleDiff > 175) {
    console.log('Lines are too parallel, rejecting');
    return null; // Lines are too parallel
  }

  // Create a long line along the bearing (extended in BOTH directions - forward and backward)
  // Using 100m (0.1km) extension which is sufficient for small geometries
  const bearingLine = turf.lineString([
    turf.destination(p1, 0.1, bearing + 180, { units: 'kilometers' }).geometry.coordinates, // 100m backward
    turf.destination(p1, 0.1, bearing, { units: 'kilometers' }).geometry.coordinates // 100m forward
  ]);

  // Create a long line along the snap line bearing (extended in both directions)
  const extendedSnapLine = turf.lineString([
    turf.destination(lineStart, 0.1, lineBearing + 180, { units: 'kilometers' }).geometry.coordinates,
    turf.destination(lineStart, 0.1, lineBearing, { units: 'kilometers' }).geometry.coordinates
  ]);

  try {
    const intersection = turf.lineIntersect(bearingLine, extendedSnapLine);

    console.log('Turf intersection result:', intersection.features.length);

    if (intersection.features.length > 0) {
      const intersectionPoint = intersection.features[0].geometry.coordinates;
      const distance = turf.distance(p1, turf.point(intersectionPoint), { units: 'meters' });

      console.log('Intersection distance:', distance, 'meters');

      // Only return if distance is reasonable (less than 10km)
      if (distance < 10000) {
        console.log('Intersection found and accepted');
        return {
          coord: intersectionPoint,
          distance: distance
        };
      } else {
        console.log('Intersection too far, rejecting');
      }
    }
  } catch (e) {
    // Intersection calculation failed
    console.log('Turf intersection threw error:', e);
    return null;
  }

  console.log('No intersection found');
  return null;
};

DrawLineStringDistance.getOrthogonalBearing = function(state, currentBearing, tolerance = 5) {
  if (!state.snapEnabled) {
    return null;
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

  return bestMatch;
};

DrawLineStringDistance.clickOnMap = function(state, e) {
  // First vertex - use existing snap functionality
  if (state.vertices.length === 0) {
    const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
    state.vertices.push([snappedCoord.lng, snappedCoord.lat]);
    state.line.updateCoordinate(0, snappedCoord.lng, snappedCoord.lat);

    // Store snapped line info if snapped to a line
    const snappedLineInfo = this.getSnappedLineBearing(snappedCoord);
    if (snappedLineInfo) {
      state.snappedLineBearing = snappedLineInfo.bearing;
      state.snappedLineSegment = snappedLineInfo.segment;
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
  const orthogonalMatch = this.getOrthogonalBearing(state, mouseBearing);

  // Determine direction (bearing) priority
  let bearingToUse = mouseBearing;
  let usePointDirection = false;

  if (snapInfo && snapInfo.type === 'point') {
    // Priority 1: Point snap direction (highest priority for direction)
    bearingToUse = turf.bearing(from, turf.point(snapInfo.coord));
    usePointDirection = true;
  } else if (orthogonalMatch !== null) {
    // Priority 2: Bearing snap (orthogonal/parallel to previous segment or snapped line)
    bearingToUse = orthogonalMatch.bearing;
  } else if (snapInfo && snapInfo.type === 'line') {
    // Priority 3: Line snap bearing (lowest priority for direction)
    bearingToUse = snapInfo.bearing;
  }

  // Determine length priority
  if (hasUserDistance) {
    // Priority 1 for length: User-entered distance (always wins)
    const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
    newVertex = destinationPoint.geometry.coordinates;
  } else if (orthogonalMatch !== null && snapInfo && snapInfo.type === 'line') {
    // Priority 2 for length: Bearing snap + line nearby -> extend/shorten to intersection
    const intersection = this.calculateLineIntersection(lastVertex, bearingToUse, snapInfo.segment);
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

  if (state.vertices.length === 0) {
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

  // SPECIAL CHECK: Closing segment perpendicular to first segment (for rectangles)
  let closingPerpendicularSnap = null;
  if (state.vertices.length >= 3) {
    const firstVertex = state.vertices[0];
    const secondVertex = state.vertices[1];
    const firstSegmentBearing = turf.bearing(turf.point(firstVertex), turf.point(secondVertex));

    // Check bearing from current position to first vertex
    const bearingToFirst = turf.bearing(turf.point([lngLat.lng, lngLat.lat]), turf.point(firstVertex));

    // Check if it's close to perpendicular to first segment
    for (const angle of [90, 270]) {
      const targetBearing = firstSegmentBearing + angle;
      const normalizedTarget = ((targetBearing % 360) + 360) % 360;
      const normalizedToFirst = ((bearingToFirst % 360) + 360) % 360;

      let diff = Math.abs(normalizedTarget - normalizedToFirst);
      if (diff > 180) diff = 360 - diff;

      if (diff <= 5) { // 5 degree tolerance
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

  if (orthogonalMatch !== null || closingPerpendicularSnap !== null) {
    console.log('Snap status:', {
      orthogonalMatch: orthogonalMatch !== null,
      closingPerpendicularSnap: closingPerpendicularSnap !== null,
      bothSnapsActive: bothSnapsActive
    });
  }

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
    // Priority 1 for length: User-entered distance (always wins)
    const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
    previewVertex = destinationPoint.geometry.coordinates;
    this.updateGuideCircle(state, lastVertex, state.currentDistance);
  } else if (bothSnapsActive) {
    // Special case: Both orthogonal and closing perpendicular are active
    console.log('Entering bothSnapsActive block');
    // Find intersection of the two constraint lines
    const orthogonalLine = {
      start: turf.destination(turf.point(lastVertex), 0.1, orthogonalMatch.bearing + 180, { units: 'kilometers' }).geometry.coordinates,
      end: turf.destination(turf.point(lastVertex), 0.1, orthogonalMatch.bearing, { units: 'kilometers' }).geometry.coordinates
    };

    const perpLine = {
      start: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing + 180, { units: 'kilometers' }).geometry.coordinates,
      end: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing, { units: 'kilometers' }).geometry.coordinates
    };

    const intersection = this.calculateLineIntersection(lastVertex, orthogonalMatch.bearing, perpLine);
    console.log('Intersection result:', intersection ? 'found' : 'not found');
    if (intersection) {
      previewVertex = intersection.coord;
      console.log('Showing both indicators');
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
    // Priority: Closing segment perpendicular to first segment (lower than regular orthogonal snap)
    // Calculate where to place point so closing segment is perpendicular to first segment
    const perpLine = {
      start: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing + 180, { units: 'kilometers' }).geometry.coordinates,
      end: turf.destination(turf.point(closingPerpendicularSnap.firstVertex), 0.1, closingPerpendicularSnap.perpendicularBearing, { units: 'kilometers' }).geometry.coordinates
    };

    const intersection = this.calculateLineIntersection(lastVertex, mouseBearing, perpLine);
    if (intersection) {
      previewVertex = intersection.coord;
      isClosingPerpendicularSnap = true;
      // Show right-angle indicator at first vertex
      // The closing segment is drawn FROM preview TO first vertex, so calculate bearing in that direction
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
    const intersection = this.calculateLineIntersection(lastVertex, bearingToUse, snapInfo.segment);
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

  // Show right-angle indicator if orthogonal snap is active (but not for point snap)
  // Note: bothSnapsActive already handles showing both indicators
  if (isOrthogonalSnap && !usePointDirection && orthogonalMatch && !bothSnapsActive) {
    console.log('Showing regular indicator (single mode)');
    this.updateRightAngleIndicator(state, lastVertex, orthogonalMatch.referenceBearing, bearingToUse, orthogonalMatch.referenceSegment);
  } else if (!isClosingPerpendicularSnap && !bothSnapsActive) {
    console.log('Removing regular indicator');
    // Remove regular indicator if not in orthogonal or dual snap mode
    this.removeRightAngleIndicator(state);
  }

  // Handle closing indicator separately
  if (!isClosingPerpendicularSnap && !bothSnapsActive) {
    console.log('Removing closing indicator');
    this.removeClosingRightAngleIndicator(state);
  }

  // Update line preview
  state.line.updateCoordinate(state.vertices.length, previewVertex[0], previewVertex[1]);
};

DrawLineStringDistance.updateGuideCircle = function(state, center, radius) {
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
  this.deleteFeature([state.line.id], { silent: true });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
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
