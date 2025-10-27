import * as turf from '@turf/turf';
import * as CommonSelectors from '../lib/common_selectors.js';
import doubleClickZoom from '../lib/double_click_zoom.js';
import * as Constants from '../constants.js';

const DrawPolygonDistance = {};

DrawPolygonDistance.onSetup = function(opts) {
  opts = opts || {};

  const polygon = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POLYGON,
      coordinates: [[]]
    }
  });

  this.addFeature(polygon);
  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.POLYGON);
  this.setActionableState({
    trash: true
  });

  const state = {
    polygon,
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

DrawPolygonDistance.createDistanceInput = function(state) {
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
      if (state.vertices.length >= 3) {
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


DrawPolygonDistance.getSnapInfo = function(lngLat) {
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

DrawPolygonDistance.calculateCircleLineIntersection = function(centerPoint, radiusMeters, lineSegment, mousePosition) {
  // Calculate where a circle (centered at centerPoint with radius in meters) intersects with a line segment
  // Returns the intersection point closest to mousePosition, or null if no intersection exists

  const center = turf.point(centerPoint);
  const lineStart = turf.point(lineSegment.start);
  const lineEnd = turf.point(lineSegment.end);

  // Extend the line segment in both directions to ensure we catch all intersections
  const lineBearing = turf.bearing(lineStart, lineEnd);
  const extendedLineStart = turf.destination(lineStart, 0.1, lineBearing + 180, { units: 'kilometers' }).geometry.coordinates;
  const extendedLineEnd = turf.destination(lineEnd, 0.1, lineBearing, { units: 'kilometers' }).geometry.coordinates;

  // Create a circle polygon approximation
  const circle = turf.circle(centerPoint, radiusMeters / 1000, { steps: 64, units: 'kilometers' });
  const extendedLine = turf.lineString([extendedLineStart, extendedLineEnd]);

  try {
    // Find intersection points between circle and line
    const intersections = turf.lineIntersect(circle, extendedLine);

    if (intersections.features.length === 0) {
      return null;
    }

    // If only one intersection, return it
    if (intersections.features.length === 1) {
      const coord = intersections.features[0].geometry.coordinates;
      const distance = turf.distance(center, turf.point(coord), { units: 'meters' });
      return { coord, distance };
    }

    // Multiple intersections: choose the one closest to mouse position
    const mousePoint = turf.point(mousePosition);
    let closestIntersection = null;
    let minDistanceToMouse = Infinity;

    for (const intersection of intersections.features) {
      const coord = intersection.geometry.coordinates;
      const distanceToMouse = turf.distance(mousePoint, turf.point(coord), { units: 'meters' });

      if (distanceToMouse < minDistanceToMouse) {
        minDistanceToMouse = distanceToMouse;
        closestIntersection = coord;
      }
    }

    if (closestIntersection) {
      const distance = turf.distance(center, turf.point(closestIntersection), { units: 'meters' });
      return { coord: closestIntersection, distance };
    }
  } catch (e) {
    return null;
  }

  return null;
};

DrawPolygonDistance.calculateLineIntersection = function(startPoint, bearing, lineSegment) {
  // Calculate where the bearing line from startPoint intersects with lineSegment (extended to infinity)
  // Returns null if lines are parallel or intersection distance is unreasonable

  const p1 = turf.point(startPoint);
  const lineStart = turf.point(lineSegment.start);
  const lineEnd = turf.point(lineSegment.end);
  const lineBearing = turf.bearing(lineStart, lineEnd);

  // Check if lines are nearly parallel (within 5 degrees)
  let angleDiff = Math.abs(bearing - lineBearing);
  if (angleDiff > 180) angleDiff = Math.abs(360 - angleDiff);
  if (angleDiff < 5 || angleDiff > 175) {
    return null; // Lines are too parallel
  }

  // Create a long line along the bearing (extended bidirectionally)
  // Using 100m (0.1km) extension which is sufficient for small geometries
  const bearingLine = turf.lineString([
    turf.destination(p1, 0.1, bearing + 180, { units: 'kilometers' }).geometry.coordinates,
    turf.destination(p1, 0.1, bearing, { units: 'kilometers' }).geometry.coordinates
  ]);

  // Create extended line along the snap line bearing
  const extendedSnapLine = turf.lineString([
    turf.destination(lineStart, 0.1, lineBearing + 180, { units: 'kilometers' }).geometry.coordinates,
    turf.destination(lineStart, 0.1, lineBearing, { units: 'kilometers' }).geometry.coordinates
  ]);

  try {
    const intersection = turf.lineIntersect(bearingLine, extendedSnapLine);

    if (intersection.features.length > 0) {
      const intersectionPoint = intersection.features[0].geometry.coordinates;
      const distance = turf.distance(p1, turf.point(intersectionPoint), { units: 'meters' });

      // Only return if distance is reasonable (less than 10km)
      if (distance < 10000) {
        return {
          coord: intersectionPoint,
          distance: distance
        };
      }
    }
  } catch (e) {
    return null;
  }

  return null;
};

DrawPolygonDistance.getSnappedLineBearing = function(snappedCoord) {
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

DrawPolygonDistance.getUnderlyingLineBearing = function(e, snappedCoord) {
  // When clicking on a point that sits on a line, detect the underlying line's bearing
  const snapping = this._ctx.snapping;
  if (!snapping || !snapping.snappedGeometry || snapping.snappedGeometry.type !== 'Point') {
    return null;
  }

  // Query all features at click point across all snap buffer layers
  const bufferLayers = snapping.bufferLayers.map(layerId => '_snap_buffer_' + layerId);
  const allFeaturesAtPoint = this.map.queryRenderedFeatures(e.point, {
    layers: bufferLayers
  });

  // Look for a line or polygon feature
  const underlyingFeature = allFeaturesAtPoint.find((feature) => {
    if (feature.id === snapping.snappedFeature.id && feature.layer.id === snapping.snappedFeature.layer.id) {
      return false;
    }
    const geomType = feature.geometry.type;
    return geomType === 'LineString' ||
           geomType === 'MultiLineString' ||
           geomType === 'Polygon' ||
           geomType === 'MultiPolygon';
  });

  if (!underlyingFeature) {
    return null;
  }

  let underlyingGeom = underlyingFeature.geometry;
  if (underlyingGeom.type === 'Polygon' || underlyingGeom.type === 'MultiPolygon') {
    underlyingGeom = turf.polygonToLine(underlyingGeom).geometry;
  }

  if (underlyingGeom.type !== 'LineString' && underlyingGeom.type !== 'MultiLineString') {
    return null;
  }

  const snapPoint = turf.point([snappedCoord.lng, snappedCoord.lat]);
  const coords = underlyingGeom.type === 'LineString' ? underlyingGeom.coordinates : underlyingGeom.coordinates.flat();

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

  if (!nearestSegment) {
    return null;
  }

  const bearing = turf.bearing(
    turf.point(nearestSegment.start),
    turf.point(nearestSegment.end)
  );

  return {
    bearing: bearing,
    segment: nearestSegment
  };
};

DrawPolygonDistance.getOrthogonalBearing = function(state, currentBearing, tolerance = 5) {
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

  // Check FIRST segment bearing (if we have 3+ vertices) - helps close rectangles!
  if (state.vertices.length >= 3) {
    const firstVertex = state.vertices[0];
    const secondVertex = state.vertices[1];
    const from = turf.point(firstVertex);
    const to = turf.point(secondVertex);
    const firstSegmentBearing = turf.bearing(from, to);

    for (const angle of orthogonalAngles) {
      const orthogonalBearing = firstSegmentBearing + angle;
      const normalizedOrthogonal = ((orthogonalBearing % 360) + 360) % 360;
      const normalizedCurrent = ((currentBearing % 360) + 360) % 360;

      let diff = Math.abs(normalizedOrthogonal - normalizedCurrent);
      if (diff > 180) diff = 360 - diff;

      if (diff <= tolerance && diff < bestDiff) {
        bestDiff = diff;
        bestMatch = {
          bearing: orthogonalBearing,
          referenceBearing: firstSegmentBearing,
          referenceType: 'first',
          referenceSegment: { start: firstVertex, end: secondVertex }
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

  return bestMatch;
};


DrawPolygonDistance.updateRightAngleIndicator = function(state, cornerVertex, referenceBearing, nextBearing, referenceSegment) {
  // Create L-shaped indicator that forms a square with the two line segments
  const cornerPoint = turf.point(cornerVertex);

  // Point 1: 2m back along reference segment (opposite direction)
  const point1 = turf.destination(cornerPoint, 2 / 1000, referenceBearing + 180, { units: 'kilometers' });

  // Point 2: The diagonal corner of the square - from point1, go 2m perpendicular (along next segment direction)
  const point2 = turf.destination(turf.point(point1.geometry.coordinates), 2 / 1000, nextBearing, { units: 'kilometers' });

  // Point 3: 2m forward along next segment
  const point3 = turf.destination(cornerPoint, 2 / 1000, nextBearing, { units: 'kilometers' });

  const indicatorFeature = {
    type: 'Feature',
    properties: { isRightAngleIndicator: true },
    geometry: {
      type: 'LineString',
      coordinates: [point1.geometry.coordinates, point2.geometry.coordinates, point3.geometry.coordinates]
    }
  };

  const map = this.map;
  if (!map) return;

  if (!map.getSource('right-angle-indicator')) {
    map.addSource('right-angle-indicator', { type: 'geojson', data: indicatorFeature });
    map.addLayer({
      id: 'right-angle-indicator',
      type: 'line',
      source: 'right-angle-indicator',
      paint: { 'line-color': '#000000', 'line-width': 1, 'line-opacity': 1.0 }
    });
  } else {
    map.getSource('right-angle-indicator').setData(indicatorFeature);
  }
};

DrawPolygonDistance.removeRightAngleIndicator = function(state) {
  const map = this.map;
  if (!map) return;
  if (map.getLayer && map.getLayer('right-angle-indicator')) map.removeLayer('right-angle-indicator');
  if (map.getSource && map.getSource('right-angle-indicator')) map.removeSource('right-angle-indicator');
};

DrawPolygonDistance.updateClosingRightAngleIndicator = function(state, cornerVertex, referenceBearing, nextBearing, referenceSegment) {
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

DrawPolygonDistance.removeClosingRightAngleIndicator = function(state) {
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

DrawPolygonDistance.onClick = function(state, e) {
  if (e.originalEvent && e.originalEvent.target === state.distanceInput) {
    return;
  }
  this.clickOnMap(state, e);
};

DrawPolygonDistance.clickOnMap = function(state, e) {
  // First vertex - use existing snap functionality
  if (state.vertices.length === 0) {
    const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
    state.vertices.push([snappedCoord.lng, snappedCoord.lat]);
    state.polygon.updateCoordinate('0.0', snappedCoord.lng, snappedCoord.lat);

    // Store snapped line info if snapped to a line
    const snappedLineInfo = this.getSnappedLineBearing(snappedCoord);
    if (snappedLineInfo) {
      state.snappedLineBearing = snappedLineInfo.bearing;
      state.snappedLineSegment = snappedLineInfo.segment;
    }

    // If snapping to a point, check for underlying line at click location
    const underlyingLineInfo = this.getUnderlyingLineBearing(e, snappedCoord);
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
  if (state.vertices.length >= 2) {
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
      const circleLineIntersection = this.calculateCircleLineIntersection(
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

    const intersection = this.calculateLineIntersection(lastVertex, orthogonalMatch.bearing, perpLine);
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

    const intersection = this.calculateLineIntersection(lastVertex, mouseBearing, perpLine);
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

  // Check for polygon closing
  if (state.vertices.length >= 3) {
    const firstVertex = state.vertices[0];
    const dist = turf.distance(turf.point(firstVertex), turf.point(newVertex), { units: 'meters' });

    if (dist < 10) {
      this.finishDrawing(state);
      return;
    }
  }

  state.vertices.push(newVertex);
  state.polygon.updateCoordinate(`0.${state.vertices.length - 1}`, newVertex[0], newVertex[1]);

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

DrawPolygonDistance.onMouseMove = function(state, e) {
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

  // Check for closing perpendicular snap (perpendicular to first segment)
  let closingPerpendicularSnap = null;
  if (state.vertices.length >= 2) {
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
      const circleLineIntersection = this.calculateCircleLineIntersection(
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

    const intersection = this.calculateLineIntersection(lastVertex, orthogonalMatch.bearing, perpLine);
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

    const intersection = this.calculateLineIntersection(lastVertex, mouseBearing, perpLine);
    if (intersection) {
      previewVertex = intersection.coord;
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
      // Fallback to mouse position
      const mouseDistance = turf.distance(from, turf.point([lngLat.lng, lngLat.lat]), { units: 'kilometers' });
      const destinationPoint = turf.destination(from, mouseDistance, mouseBearing, { units: 'kilometers' });
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

  // Show right-angle indicator if orthogonal snap is active (but not for point snap or dual snap)
  if (isOrthogonalSnap && !usePointDirection && !bothSnapsActive && !isClosingPerpendicularSnap && orthogonalMatch) {
    this.updateRightAngleIndicator(state, lastVertex, orthogonalMatch.referenceBearing, bearingToUse, orthogonalMatch.referenceSegment);
  } else {
    this.removeRightAngleIndicator(state);
  }

  // Clean up closing indicator if not in use
  if (!isClosingPerpendicularSnap && !bothSnapsActive) {
    this.removeClosingRightAngleIndicator(state);
  }

  // Calculate actual distance to preview vertex (accounts for all snapping)
  const actualDistance = turf.distance(from, turf.point(previewVertex), { units: 'meters' });

  // Update distance label
  this.updateDistanceLabel(state, lastVertex, previewVertex, actualDistance);

  // Update polygon preview - add closing line
  const allCoords = [...state.vertices, previewVertex];

  // Add preview line back to first vertex if we have enough vertices
  if (state.vertices.length >= 2) {
    allCoords.push(state.vertices[0]);
  }

  state.polygon.setCoordinates([allCoords]);
};

DrawPolygonDistance.updateDistanceLabel = function(state, startVertex, endVertex, distance) {
  const map = this.map;
  if (!map) return;

  // Clear existing debounce timer
  if (state.labelDebounceTimer) {
    clearTimeout(state.labelDebounceTimer);
  }

  // Hide label immediately
  if (map.getLayer && map.getLayer('distance-label-text')) {
    map.setPaintProperty('distance-label-text', 'text-opacity', 0);
  }

  // Format distance to 1 decimal place
  const distanceText = `${distance.toFixed(1)}m`;

  // Calculate midpoint of the segment
  const start = turf.point(startVertex);
  const end = turf.point(endVertex);
  const midpoint = turf.midpoint(start, end);

  // Calculate bearing for rotation
  const bearing = turf.bearing(start, end);

  // Offset the label position above the line (perpendicular to bearing)
  // Use 3m offset above the line (increased from 1.5m to ensure it's clearly above)
  const offsetDistance = 3 / 1000; // Convert to km for turf
  const perpendicularBearing = bearing - 90; // 90 degrees perpendicular to the LEFT (above when rotated)
  const offsetMidpoint = turf.destination(midpoint, offsetDistance, perpendicularBearing, { units: 'kilometers' });

  // Create a feature for the text label at the offset midpoint
  // Rotate text 90 degrees counter-clockwise from the line bearing
  const labelFeature = {
    type: 'Feature',
    properties: {
      distanceLabel: true,
      distance: distanceText,
      rotation: bearing - 90 // Rotate 90 degrees counter-clockwise
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
        'text-allow-overlap': false,
        'text-ignore-placement': false
      },
      paint: {
        'text-color': '#000000',
        'text-opacity': 0
      }
    });
  } else {
    map.getSource('distance-label-text').setData(labelFeatureCollection);
  }

  // Set debounce timer to show label after 300ms of no movement
  state.labelDebounceTimer = setTimeout(() => {
    if (map.getLayer && map.getLayer('distance-label-text')) {
      map.setPaintProperty('distance-label-text', 'text-opacity', 1);
    }
  }, 300);
};

DrawPolygonDistance.removeDistanceLabel = function(state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('distance-label-text')) {
    map.removeLayer('distance-label-text');
  }
  if (map.getSource && map.getSource('distance-label-text')) {
    map.removeSource('distance-label-text');
  }
};

DrawPolygonDistance.updateGuideCircle = function(state, center, radius) {
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

DrawPolygonDistance.removeGuideCircle = function(state) {
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

DrawPolygonDistance.onKeyUp = function(state, e) {
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
    if (state.vertices.length >= 3) {
      this.finishDrawing(state);
    }
  }

  // Escape key
  if (e.keyCode === 27 || CommonSelectors.isEscapeKey(e)) {
    if (state.vertices.length >= 3) {
      this.finishDrawing(state);
    } else {
      this.deleteFeature([state.polygon.id], { silent: true });
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
      state.polygon.removeCoordinate(`0.${state.vertices.length}`);
    } else if (state.vertices.length === 1) {
      state.vertices.pop();
      state.polygon.setCoordinates([[]]);
    }
  }
};

DrawPolygonDistance.finishDrawing = function(state) {
  if (state.vertices.length < 3) {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
    return;
  }

  // Close the polygon
  const closedCoords = [...state.vertices, state.vertices[0]];
  state.polygon.setCoordinates([closedCoords]);

  // Clean up indicators before finishing
  this.removeGuideCircle(state);
  this.removeRightAngleIndicator(state);

  this.fire(Constants.events.CREATE, {
    features: [state.polygon.toGeoJSON()]
  });

  this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.polygon.id]
  });
};

DrawPolygonDistance.onStop = function(state) {
  doubleClickZoom.enable(this);
  this.activateUIButton();
  this.removeGuideCircle(state);
  this.removeRightAngleIndicator(state);
  this.removeClosingRightAngleIndicator(state);
  this.removeDistanceLabel(state);

  if (state.distanceContainer) {
    state.distanceContainer.remove();
    state.distanceContainer = null;
  }

  if (state.distanceKeyHandler) {
    document.removeEventListener('keydown', state.distanceKeyHandler);
    state.distanceKeyHandler = null;
  }

  state.distanceInput = null;

  if (this.getFeature(state.polygon.id) === undefined) return;

  if (state.vertices.length < 3) {
    this.deleteFeature([state.polygon.id], { silent: true });
  }
};

DrawPolygonDistance.onTrash = function(state) {
  // Remove the last drawn vertex instead of deleting the entire feature
  if (state.vertices.length > 1) {
    state.vertices.pop();
    state.polygon.removeCoordinate(`0.${state.vertices.length}`);

    // Also remove the preview coordinate
    if (state.polygon.coordinates[0].length > state.vertices.length) {
      state.polygon.removeCoordinate(`0.${state.vertices.length}`);
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
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }
};

DrawPolygonDistance.toDisplayFeatures = function(state, geojson, display) {
  const isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = isActivePolygon ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;

  if (!isActivePolygon) return display(geojson);

  // Display vertices
  if (state.vertices.length > 0) {
    state.vertices.forEach((vertex, index) => {
      display({
        type: 'Feature',
        properties: {
          meta: Constants.meta.VERTEX,
          parent: state.polygon.id,
          coord_path: `0.${index}`,
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

DrawPolygonDistance.onTap = DrawPolygonDistance.onClick;

export default DrawPolygonDistance;

