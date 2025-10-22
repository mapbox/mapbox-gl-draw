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
    snapTolerance: 20
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


DrawPolygonDistance.getOrthogonalBearing = function(state, currentBearing, tolerance = 5) {
  if (!state.snapEnabled || state.vertices.length < 2) {
    return null;
  }

  // Calculate the bearing of the last segment
  const lastVertex = state.vertices[state.vertices.length - 1];
  const secondLastVertex = state.vertices[state.vertices.length - 2];
  const from = turf.point(secondLastVertex);
  const to = turf.point(lastVertex);
  const lastSegmentBearing = turf.bearing(from, to);

  // Check orthogonal directions: 0°, 90°, 180°, 270° from last segment
  const orthogonalAngles = [0, 90, 180, 270];

  for (const angle of orthogonalAngles) {
    const orthogonalBearing = lastSegmentBearing + angle;
    const normalizedOrthogonal = ((orthogonalBearing % 360) + 360) % 360;
    const normalizedCurrent = ((currentBearing % 360) + 360) % 360;

    // Calculate the smallest angle difference
    let diff = Math.abs(normalizedOrthogonal - normalizedCurrent);
    if (diff > 180) diff = 360 - diff;

    if (diff <= tolerance) {
      return orthogonalBearing;
    }
  }

  return null;
};


DrawPolygonDistance.updateRightAngleIndicator = function(state, cornerVertex, prevBearing, nextBearing) {
  // Create L-shaped indicator that forms a square with the two line segments
  const cornerPoint = turf.point(cornerVertex);

  // Point 1: 2m back along previous segment (opposite direction)
  const point1 = turf.destination(cornerPoint, 2 / 1000, prevBearing + 180, { units: 'kilometers' });

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
    return;
  }

  // Subsequent vertices
  let newVertex;
  const lastVertex = state.vertices[state.vertices.length - 1];

  if (state.currentDistance !== null && state.currentDistance > 0) {
    // Distance mode: check for feature snap first
    const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);

    // Check if actually snapped to a feature
    const didSnap = snappedCoord.lng !== e.lngLat.lng || snappedCoord.lat !== e.lngLat.lat;

    let bearingToUse;
    if (didSnap) {
      // Feature snap takes priority - use snapped coordinate for direction
      const from = turf.point(lastVertex);
      const to = turf.point([snappedCoord.lng, snappedCoord.lat]);
      bearingToUse = turf.bearing(from, to);
    } else {
      // No feature snap - check for bearing-based orthogonal snap
      const from = turf.point(lastVertex);
      const to = turf.point([e.lngLat.lng, e.lngLat.lat]);
      const mouseBearing = turf.bearing(from, to);
      const orthogonalBearing = this.getOrthogonalBearing(state, mouseBearing);

      bearingToUse = orthogonalBearing !== null ? orthogonalBearing : mouseBearing;
    }

    // Place vertex at exact distance in calculated direction
    const from = turf.point(lastVertex);
    const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
    newVertex = destinationPoint.geometry.coordinates;
  } else {
    // Free placement: check for feature snap first
    const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);

    // Check if actually snapped to a feature
    const didSnap = snappedCoord.lng !== e.lngLat.lng || snappedCoord.lat !== e.lngLat.lat;

    if (didSnap) {
      // Feature snap takes priority
      newVertex = [snappedCoord.lng, snappedCoord.lat];
    } else if (state.snapEnabled && state.vertices.length >= 2) {
      // No feature snap - check for bearing-based orthogonal snap
      const from = turf.point(lastVertex);
      const to = turf.point([e.lngLat.lng, e.lngLat.lat]);
      const mouseBearing = turf.bearing(from, to);
      const mouseDistance = turf.distance(from, to, { units: 'kilometers' });
      const orthogonalBearing = this.getOrthogonalBearing(state, mouseBearing);

      if (orthogonalBearing !== null) {
        // Snap to orthogonal bearing at mouse distance
        const destinationPoint = turf.destination(from, mouseDistance, orthogonalBearing, { units: 'kilometers' });
        newVertex = destinationPoint.geometry.coordinates;
      } else {
        // Use mouse position
        newVertex = [e.lngLat.lng, e.lngLat.lat];
      }
    } else {
      // No snapping available
      newVertex = [e.lngLat.lng, e.lngLat.lat];
    }
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

  // Calculate preview position
  let previewVertex;
  const lastVertex = state.vertices[state.vertices.length - 1];

  if (state.currentDistance !== null && state.currentDistance > 0) {
    // Distance mode: check for feature snap first
    const snappedCoord = this._ctx.snapping.snapCoord(lngLat);

    // Check if actually snapped to a feature
    const didSnap = snappedCoord.lng !== lngLat.lng || snappedCoord.lat !== lngLat.lat;

    let bearingToUse;
    let isOrthogonalSnap = false;
    if (didSnap) {
      // Feature snap takes priority - use snapped coordinate for direction
      const from = turf.point(lastVertex);
      const to = turf.point([snappedCoord.lng, snappedCoord.lat]);
      bearingToUse = turf.bearing(from, to);
    } else {
      // No feature snap - check for bearing-based orthogonal snap
      const from = turf.point(lastVertex);
      const to = turf.point([lngLat.lng, lngLat.lat]);
      const mouseBearing = turf.bearing(from, to);
      const orthogonalBearing = this.getOrthogonalBearing(state, mouseBearing);

      if (orthogonalBearing !== null) {
        bearingToUse = orthogonalBearing;
        isOrthogonalSnap = true;
      } else {
        bearingToUse = mouseBearing;
      }
    }

    // Place preview vertex at exact distance in calculated direction
    const from = turf.point(lastVertex);
    const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
    previewVertex = destinationPoint.geometry.coordinates;

    this.updateGuideCircle(state, lastVertex, state.currentDistance);

    // Show right-angle indicator if orthogonal snap is active
    if (isOrthogonalSnap && state.vertices.length >= 2) {
      const secondLastVertex = state.vertices[state.vertices.length - 2];
      const prevFrom = turf.point(secondLastVertex);
      const prevTo = turf.point(lastVertex);
      const prevBearing = turf.bearing(prevFrom, prevTo);
      this.updateRightAngleIndicator(state, lastVertex, prevBearing, bearingToUse);
    } else {
      this.removeRightAngleIndicator(state);
    }
  } else {
    // Free placement: check for feature snap first
    const snappedCoord = this._ctx.snapping.snapCoord(lngLat);

    // Check if actually snapped to a feature
    const didSnap = snappedCoord.lng !== lngLat.lng || snappedCoord.lat !== lngLat.lat;

    if (didSnap) {
      // Feature snap takes priority
      previewVertex = [snappedCoord.lng, snappedCoord.lat];
    } else if (state.snapEnabled && state.vertices.length >= 2) {
      // No feature snap - check for bearing-based orthogonal snap
      const from = turf.point(lastVertex);
      const to = turf.point([lngLat.lng, lngLat.lat]);
      const mouseBearing = turf.bearing(from, to);
      const mouseDistance = turf.distance(from, to, { units: 'kilometers' });
      const orthogonalBearing = this.getOrthogonalBearing(state, mouseBearing);

      if (orthogonalBearing !== null) {
        // Snap to orthogonal bearing at mouse distance
        const destinationPoint = turf.destination(from, mouseDistance, orthogonalBearing, { units: 'kilometers' });
        previewVertex = destinationPoint.geometry.coordinates;

        // Show right-angle indicator
        const secondLastVertex = state.vertices[state.vertices.length - 2];
        const prevFrom = turf.point(secondLastVertex);
        const prevTo = turf.point(lastVertex);
        const prevBearing = turf.bearing(prevFrom, prevTo);
        this.updateRightAngleIndicator(state, lastVertex, prevBearing, orthogonalBearing);
      } else {
        // Use mouse position
        previewVertex = [lngLat.lng, lngLat.lat];
        this.removeRightAngleIndicator(state);
      }
    } else {
      // No snapping available
      previewVertex = [lngLat.lng, lngLat.lat];
      this.removeRightAngleIndicator(state);
    }
    this.removeGuideCircle(state);
  }

  // Update polygon preview - add closing line
  const allCoords = [...state.vertices, previewVertex];

  // Add preview line back to first vertex if we have enough vertices
  if (state.vertices.length >= 2) {
    allCoords.push(state.vertices[0]);
  }

  state.polygon.setCoordinates([allCoords]);
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
  this.deleteFeature([state.polygon.id], { silent: true });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
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

