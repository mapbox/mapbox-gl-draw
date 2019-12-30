const CommonSelectors = require('../lib/common_selectors');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const createVertex = require('../lib/create_vertex');

const DrawLineString = {};

const turf = require('@turf/turf');

DrawLineString.onSetup = function(opts) {
  opts = opts || {};
  const featureId = opts.featureId;

  let line, currentVertexPosition;
  let direction = 'forward';
  if (featureId) {
    line = this.getFeature(featureId);
    if (!line) {
      throw new Error('Could not find a feature with the provided featureId');
    }
    let from = opts.from;
    if (from && from.type === 'Feature' && from.geometry && from.geometry.type === 'Point') {
      from = from.geometry;
    }
    if (from && from.type === 'Point' && from.coordinates && from.coordinates.length === 2) {
      from = from.coordinates;
    }
    if (!from || !Array.isArray(from)) {
      throw new Error('Please use the `from` property to indicate which point to continue the line from');
    }
    const lastCoord = line.coordinates.length - 1;
    if (line.coordinates[lastCoord][0] === from[0] && line.coordinates[lastCoord][1] === from[1]) {
      currentVertexPosition = lastCoord + 1;
      // add one new coordinate to continue from
      line.addCoordinate(currentVertexPosition, ...line.coordinates[lastCoord]);
    } else if (line.coordinates[0][0] === from[0] && line.coordinates[0][1] === from[1]) {
      direction = 'backwards';
      currentVertexPosition = 0;
      // add one new coordinate to continue from
      line.addCoordinate(currentVertexPosition, ...line.coordinates[0]);
    } else {
      throw new Error('`from` should match the point at either the start or the end of the provided LineString');
    }
  } else {
    line = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.LINE_STRING,
        coordinates: []
      }
    });
    currentVertexPosition = 0;
    this.addFeature(line);
  }

  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.LINE);
  this.setActionableState({
    trash: true
  });
  this.enableSnapping();

  return {
    line,
    currentVertexPosition,
    direction
  };
};

DrawLineString.clickAnywhere = function(state, e) {
  const snapped = this.snapCoord(e.lngLat);
  if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition - 1]) ||
      state.direction === 'backwards' && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition + 1])) {
    return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
  }
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  state.line.updateCoordinate(state.currentVertexPosition, snapped.lng, snapped.lat);
  if (state.direction === 'forward') {
    state.currentVertexPosition++;
    state.line.updateCoordinate(state.currentVertexPosition, snapped.lng, snapped.lat);
  } else {
    state.line.addCoordinate(0, snapped.lng, snapped.lat);
  }
};

DrawLineString.clickOnVertex = function(state) {
  return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
};

DrawLineString.snapCoord = function snapCoord(lngLat) {
  if (this.snappedGeometry) {
    const hoverPoint = {
      type: 'Point',
      coordinates: [lngLat.lng, lngLat.lat]
    };
    let snapPoint;
    if (this.snappedGeometry.type === 'Point') {
      snapPoint = { type: 'Feature', geometry: this.snappedGeometry };
    } else {
      snapPoint = turf.nearestPointOnLine(this.snappedGeometry, hoverPoint);
    }
    this.map.getSource('_snap_vertex').setData(snapPoint);
    return {
      lng: snapPoint.geometry.coordinates[0],
      lat: snapPoint.geometry.coordinates[1],
    };
  } else {
    this.map.getSource('_snap_vertex').setData({ type: 'FeatureCollection', features: []});

    return lngLat;
  }
};

DrawLineString.onMouseMove = function(state, e) {
  state.line.updateCoordinate(state.currentVertexPosition, this.snapCoord(e.lngLat).lng, this.snapCoord(e.lngLat).lat);
  if (CommonSelectors.isVertex(e)) {
    this.updateUIClasses({ mouse: Constants.cursors.POINTER });
  }
};

DrawLineString.onTap = DrawLineString.onClick = function(state, e) {
  if (CommonSelectors.isVertex(e)) return this.clickOnVertex(state, e);
  this.clickAnywhere(state, e);
};

DrawLineString.onKeyUp = function(state, e) {
  if (CommonSelectors.isEnterKey(e)) {
    this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
  } else if (CommonSelectors.isEscapeKey(e)) {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }
};

DrawLineString.onStop = function(state) {
  doubleClickZoom.enable(this);
  this.activateUIButton();

  this.disableSnapping();

  // check to see if we've deleted this feature
  if (this.getFeature(state.line.id) === undefined) return;

  //remove last added coordinate
  state.line.removeCoordinate(`${state.currentVertexPosition}`);
  if (state.line.isValid()) {
    this.map.fire(Constants.events.CREATE, {
      features: [state.line.toGeoJSON()]
    });
  } else {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
  }
};

DrawLineString.onTrash = function(state) {
  this.deleteFeature([state.line.id], { silent: true });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DrawLineString.toDisplayFeatures = function(state, geojson, display) {
  const isActiveLine = geojson.properties.id === state.line.id;
  geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  if (!isActiveLine) return display(geojson);
  // Only render the line if it has at least one real coordinate
  if (geojson.geometry.coordinates.length < 2) return;
  geojson.properties.meta = Constants.meta.FEATURE;
  display(createVertex(
    state.line.id,
    geojson.geometry.coordinates[state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1],
    `${state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1}`,
    false
  ));

  display(geojson);
};

DrawLineString.setSnapHoverState = function(f, state) {
  if (f.id !== undefined) {
    this.map.setFeatureState({ 
      id: f.id,
      source: f.source,
      ...(f.sourceLayer && {sourceLayer: f.sourceLayer}),
    }, { 'snap-hover': state});
  }
};

DrawLineString.enableSnapping = function() {
  this._overHandler = e => {
    const f = e.features[0];
    if (this.snappedFeature) {
      if (this.snappedFeature.layer !== f.layer) {
        this.setSnapHoverState(this.snappedFeature, false);
      } else {
        return;
      }

    }
    console.log('Now over ', f);
    this.snappedGeometry = f.geometry;
    this.snappedFeature = f;
    this.setSnapHoverState(this.snappedFeature, true);
  };
  this._outHandler = e => {
    console.log('out', e);
    if (this.snappedFeature) {
      this.setSnapHoverState(this.snappedFeature, false);
      this.snappedGeometry = undefined;
      this.snappedFeature = undefined;
    }
  };


  this.drawConfig.snapping.layers.forEach(layerId => {
    const bufferLayerId = `_${layerId}_buffer`;
    const layerDef = this.map.getLayer(layerId);
    
    const newLayer = {
      id: bufferLayerId,
      source: layerDef.source,
    };
    if (layerDef.type === 'line' || layerDef.type === 'fill' || layerDef.type === 'fill-extrusion') {
      newLayer.type = 'line';
    } else if (layerDef.type === 'circle' || layerDef.type === 'symbol') {
      newLayer.type = 'circle';
    } else {
      console.error(`Unsupported snap layer type ${layerDef.type} for layer ${layerDef.id}`);
      return;
    }

    if (layerDef.sourceLayer) {
      newLayer['source-layer'] = layerDef.sourceLayer;
    }
    if (layerDef.filter) {
      newLayer.filter = layerDef.filter;
    }
    if (newLayer.type === 'circle') {
      newLayer.paint = {
        'circle-color': 'hsla(0,100%,50%,0.001)',
        'circle-radius': 20, // TODO configurable
      }
    } else {
      newLayer.paint = {
        'line-color': 'hsla(0,100%,50%,0.001)',
        'line-width': 40, // TODO configurable
      }
    }
    map.addLayer(newLayer);
    this.map.on('mousemove', bufferLayerId, this._overHandler);
    this.map.on('mouseout', bufferLayerId, this._outHandler);
  });
  this.map.addSource('_snap_vertex', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });
  this.map.addLayer({
    id: '_snap_vertex',
    type: 'circle',
    source: '_snap_vertex',
    paint: {
      'circle-color': 'transparent',
      'circle-radius': 5,
      'circle-stroke-width': 3,
      'circle-stroke-color': 'orange'
    }
  });
};

DrawLineString.disableSnapping = function() {
  this.drawConfig.snapping.layers.forEach(layerId => {
    const bufferLayerId = `_${layerId}_buffer`;
    this.map.off('mouseover', bufferLayerId, this._overHandler);
    this.map.off('mouseout', bufferLayerId, this._outHandler);

    this.map.removeLayer(bufferLayerId);
  });
  this.map.removeLayer('_snap_vertex');
  this.map.removeSource('_snap_vertex');


};

module.exports = DrawLineString;
