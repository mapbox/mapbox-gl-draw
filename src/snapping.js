const turf = require('@turf/turf');
const Snapping = module.exports = function(ctx) {
  ctx.snapping = this;
  this.ctx = ctx;
  this.map = ctx.map;
  this.snappedFeature = undefined;
  // the geometry of the feature hovered over. Polygons get transformed to line geometry.
  this.snappedGeometry = undefined;
};

Snapping.prototype.setSnapHoverState = function(f, state) {
  if (f.id !== undefined) {
    this.map.setFeatureState({
      id: f.id,
      source: f.source,
      ...(f.sourceLayer && {sourceLayer: f.sourceLayer}),
    }, { 'snap-hover': state});
  }
};

Snapping.prototype.mouseoverHandler = function(e) {
  const f = e.features[0];
  if (this.snappedFeature) {
    if (this.snappedFeature.layer !== f.layer) {
      this.setSnapHoverState(this.snappedFeature, false);
    } else {
      return;
    }
  }
  
  if (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') {
    this.snappedGeometry = turf.polygonToLine(f.geometry).geometry;
  } else {
    this.snappedGeometry = f.geometry;
  }
  this.snappedFeature = f;
  this.setSnapHoverState(this.snappedFeature, true);
};
Snapping.prototype.mouseoutHandler = function() {
  if (this.snappedFeature) {
    this.setSnapHoverState(this.snappedFeature, false);
    this.snappedGeometry = undefined;
    this.snappedFeature = undefined;
  }
};

Snapping.prototype.enableSnapping = function() {
  const createBufferLayer = (layerId) => {
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
        'circle-radius': this.ctx.options.snapDistance,
      }
    } else {
      newLayer.paint = {
        'line-color': 'hsla(0,100%,50%,0.001)',
        'line-width': this.ctx.options.snapDistance * 2
      };
    }
    this.map.addLayer(newLayer);
    this.map.on('mousemove', bufferLayerId, this.mouseoverHandler.bind(this));
    this.map.on('mouseout', bufferLayerId, this.mouseoutHandler.bind(this));
  };
  this.ctx.options.snapLayers.forEach(createBufferLayer);
  this.map.addSource('_snap_vertex', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });
  this.map.addLayer({
    // TODO rework into theme
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

Snapping.prototype.disableSnapping = function() {
  this.ctx.options.snapLayers.forEach((layerId) => {
    const bufferLayerId = `_${layerId}_buffer`;
    this.map.off('mouseover', bufferLayerId, this.mouseoverHandler); //TODO fix
    this.map.off('mouseout', bufferLayerId, this.mouseoutHandler);    
    this.map.removeLayer(bufferLayerId);
  });
  this.map.removeLayer('_snap_vertex');
  this.map.removeSource('_snap_vertex');
};


Snapping.prototype.snapCoord = function snapCoord(lngLat) {
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
