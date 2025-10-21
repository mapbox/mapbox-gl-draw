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
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'distance (m)';
  input.className = 'distance-mode-input';
  input.style.cssText = `
    position: absolute;
    z-index: 999;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #ccc;
    border-radius: 3px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    padding: 4px 8px;
    font-size: 12px;
    width: 100px;
    display: none;
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

DrawPolygonDistance.updateInputPosition = function(state, pointOnScreen) {
  if (state.distanceInput && state.vertices.length > 0 && state.inputEnabled) {
    const offset = { x: 50, y: -30 };
    state.distanceInput.style.left = pointOnScreen.x + offset.x + 'px';
    state.distanceInput.style.top = pointOnScreen.y + offset.y + 'px';
    state.distanceInput.style.display = 'block';
  }
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
    // Distance mode: snap to features for direction, but use exact distance
    const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);

    // Check if we snapped to a 90° snap point first
    const snapPoint = this.findClosestSnapPoint(state, e.lngLat, this.map);

    if (snapPoint) {
      // Use 90° snap point
      newVertex = snapPoint;
    } else {
      // Use snapped coordinate for direction
      const from = turf.point(lastVertex);
      const to = turf.point([snappedCoord.lng, snappedCoord.lat]);
      const bearingValue = turf.bearing(from, to);
      const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingValue, { units: 'kilometers' });
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else {
    // Free placement: snap to features directly
    const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
    newVertex = [snappedCoord.lng, snappedCoord.lat];
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

  // Clear snap points
  state.snapPoints = [];

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

  this.updateInputPosition(state, pointOnScreen);

  if (state.vertices.length === 0) {
    return;
  }

  // Calculate preview position
  let previewVertex;
  const lastVertex = state.vertices[state.vertices.length - 1];

  if (state.currentDistance !== null && state.currentDistance > 0) {
    // Distance mode: snap to features for direction, but use exact distance
    const snappedCoord = this._ctx.snapping.snapCoord(lngLat);

    // Check if we snapped to a 90° snap point first
    const snapPoint = this.findClosestSnapPoint(state, lngLat, this.map);

    if (snapPoint) {
      // Use 90° snap point
      previewVertex = snapPoint;
    } else {
      // Use snapped coordinate for direction
      const from = turf.point(lastVertex);
      const to = turf.point([snappedCoord.lng, snappedCoord.lat]);
      const bearingValue = turf.bearing(from, to);
      const destinationPoint = turf.destination(from, state.currentDistance / 1000, bearingValue, { units: 'kilometers' });
      previewVertex = destinationPoint.geometry.coordinates;
    }

    this.updateGuideCircle(state, lastVertex, state.currentDistance);
  } else {
    // Free placement: snap to features directly
    const snappedCoord = this._ctx.snapping.snapCoord(lngLat);
    previewVertex = [snappedCoord.lng, snappedCoord.lat];
    this.removeGuideCircle(state);
  }

  // Update polygon preview
  state.polygon.updateCoordinate(`0.${state.vertices.length}`, previewVertex[0], previewVertex[1]);
};

DrawPolygonDistance.calculateSnapPoints = function(state, center, radius) {
  if (state.vertices.length < 2) {
    state.snapPoints = [];
    return;
  }

  const lastVertex = state.vertices[state.vertices.length - 1];
  const secondLastVertex = state.vertices[state.vertices.length - 2];

  const from = turf.point(secondLastVertex);
  const to = turf.point(lastVertex);
  const lastSegmentBearing = turf.bearing(from, to);

  const snapAngles = [0, 90, 180, 270];
  state.snapPoints = snapAngles.map((angle) => {
    const snapBearing = lastSegmentBearing + angle;
    const snapPoint = turf.destination(turf.point(center), radius / 1000, snapBearing, { units: 'kilometers' });
    return snapPoint.geometry.coordinates;
  });
};

DrawPolygonDistance.findClosestSnapPoint = function(state, mouseLngLat, map) {
  if (!state.snapEnabled || state.snapPoints.length === 0) {
    return null;
  }

  const mousePoint = map.project(mouseLngLat);
  let closestSnapPoint = null;
  let closestDistance = Infinity;

  state.snapPoints.forEach((snapCoord) => {
    const snapLngLat = { lng: snapCoord[0], lat: snapCoord[1] };
    const snapPoint = map.project(snapLngLat);

    const distance = Math.sqrt(Math.pow(mousePoint.x - snapPoint.x, 2) + Math.pow(mousePoint.y - snapPoint.y, 2));

    if (distance < state.snapTolerance && distance < closestDistance) {
      closestDistance = distance;
      closestSnapPoint = snapCoord;
    }
  });

  return closestSnapPoint;
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

  if (state.snapEnabled) {
    this.calculateSnapPoints(state, center, radius);
  }

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
    if (state.vertices.length === 0) return;

    if (state.currentPosition) {
      this.clickOnMap(state, { lngLat: state.currentPosition });
      return;
    }

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
      if (state.distanceInput) {
        state.distanceInput.style.display = 'none';
      }
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

  // Close the polygon ring
  const closedRing = state.vertices.concat([state.vertices[0]]);
  state.polygon.setCoordinates([closedRing]);

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

  if (state.distanceInput) {
    state.distanceInput.remove();
    state.distanceInput = null;
  }

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

  // Display snap points
  if (state.snapEnabled && state.snapPoints.length > 0) {
    state.snapPoints.forEach((snapCoord) => {
      display({
        type: 'Feature',
        properties: {
          meta: 'snap-point',
          parent: state.polygon.id,
          active: Constants.activeStates.INACTIVE
        },
        geometry: {
          type: 'Point',
          coordinates: snapCoord
        }
      });
    });
  }

  display(geojson);
};

DrawPolygonDistance.onTap = DrawPolygonDistance.onClick;

export default DrawPolygonDistance;
