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
    snapTolerance: 20
  };

  this.createDistanceInput(state);

  return state;
};

DrawLineStringDistance.createDistanceInput = function(state) {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'distance (m)';
  input.className = 'distance-mode-input';
  input.style.cssText = `
    position: fixed;
    z-index: 10000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(200, 200, 200, 0.8);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 4px 8px;
    font-size: 12px;
    width: 100px;
    display: none;
    pointer-events: auto;
    transition: opacity 0.2s ease-in-out;
  `;

  input.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(parseFloat(value))) {
      state.currentDistance = value === '' ? null : parseFloat(value);
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
      if (state.currentDistance !== null && state.currentDistance > 0) {
        e.target.blur();
      } else if (state.currentPosition) {
        this.clickOnMap(state, { lngLat: state.currentPosition });
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      state.snapEnabled = !state.snapEnabled;
      if (!state.snapEnabled) {
        state.inputEnabled = false;
        e.target.style.display = 'none';
        state.currentDistance = null;
        state.snapPoints = [];
        this.removeGuideCircle(state);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.onKeyUp(state, { keyCode: 27 });
    } else if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault();
      this.onKeyUp(state, { keyCode: 8 });
    }
  });

  document.body.appendChild(input);
  state.distanceInput = input;
};

DrawLineStringDistance.updateInputPosition = function(state, pointOnScreen) {
  if (state.distanceInput && state.vertices.length > 0 && state.inputEnabled) {
    const offset = { x: 50, y: -30 };
    state.distanceInput.style.left = pointOnScreen.x + offset.x + 'px';
    state.distanceInput.style.top = pointOnScreen.y + offset.y + 'px';
    state.distanceInput.style.display = 'block';
  }
};

DrawLineStringDistance.onClick = function(state, e) {
  if (e.originalEvent && e.originalEvent.target === state.distanceInput) {
    return;
  }
  this.clickOnMap(state, e);
};

DrawLineStringDistance.getOrthogonalBearing = function(state, currentBearing, tolerance = 5) {
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

DrawLineStringDistance.clickOnMap = function(state, e) {
  // First vertex - use existing snap functionality
  if (state.vertices.length === 0) {
    const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
    state.vertices.push([snappedCoord.lng, snappedCoord.lat]);
    state.line.updateCoordinate(0, snappedCoord.lng, snappedCoord.lat);

    if (state.distanceInput) {
      state.distanceInput.style.display = 'block';
      setTimeout(() => state.distanceInput.focus(), 10);
    }
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
    // Free placement: snap to features directly
    const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
    newVertex = [snappedCoord.lng, snappedCoord.lat];
  }

  state.vertices.push(newVertex);
  state.line.updateCoordinate(state.vertices.length - 1, newVertex[0], newVertex[1]);

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

  this.updateInputPosition(state, pointOnScreen);

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

      bearingToUse = orthogonalBearing !== null ? orthogonalBearing : mouseBearing;
    }

    // Place preview vertex at exact distance in calculated direction
    const from = turf.point(lastVertex);
    const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingToUse, { units: 'kilometers' });
    previewVertex = destinationPoint.geometry.coordinates;

    this.updateGuideCircle(state, lastVertex, state.currentDistance);
  } else {
    // Free placement: snap to features directly
    const snappedCoord = this._ctx.snapping.snapCoord(lngLat);
    previewVertex = [snappedCoord.lng, snappedCoord.lat];
    this.removeGuideCircle(state);
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
        'line-opacity': 0.8
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
    if (state.vertices.length === 0) return;

    if (state.currentPosition) {
      this.clickOnMap(state, { lngLat: state.currentPosition });
      return;
    }

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
      if (state.distanceInput) {
        state.distanceInput.style.display = 'none';
      }
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

  if (state.distanceInput) {
    state.distanceInput.remove();
    state.distanceInput = null;
  }

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
