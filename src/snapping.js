const turf = require("@turf/turf");
const Snapping = (module.exports = function (ctx) {
  /*
  this: snapping object, just this module
  this.ctx: contains api, options, map.
*/
  ctx.snapping = this;
  this.ctx = ctx;
  this.map = ctx.map;
  ctx.map.snapping = this; // must remove
  ctx.map.ctx = ctx;

  // the feature being snapped to
  this.snappedFeature = undefined;

  // the geometry of the feature hovered over. Polygons get transformed to line geometry.
  this.snappedGeometry = undefined;
  // list of layers that have been created for the purpose of testing if the mouse is near the layer we care about
  this.bufferLayers = [];
  this.ctx.api.refreshSnapLayers = () => {
    this.updateSnapLayers();
  };

  // snapLayers: array or function of layer id's that can be snapped to
  this.ctx.api.setSnapLayers = (snapLayers) => {
    this.ctx.options.snapLayers = snapLayers;
    this.updateSnapLayers();
  };
  // snapFeatureFilter: optional additional function that specifies whether an individual feature is snappable
  this.ctx.api.setSnapFeatureFilter = (snapFeatureFilter) => {
    this.ctx.options.snapFeatureFilter = snapFeatureFilter;
  };

  this.ctx.api.clearSnapCoord = () => {
    this.clearSnapCoord();
  };

  this.map.on("styledata", () => {
    this.updateSnapLayers();
  });

  this.updateSnapLayers = () => {
    const newLayers = this.snappableLayers();
    this.bufferLayers
      .filter((l) => newLayers.indexOf(l) < 0)
      .map((l) => (console.log(`Remove snap buffer ${l.id}`), l))
      .forEach((l) => this.removeSnapBuffer(l));
    newLayers
      .filter((l) => this.bufferLayers.indexOf(l) < 0)
      .map((l) => (console.log(`Add snap buffer ${l.id}`), l))
      .forEach((l) => this.addSnapBuffer(l));
    this.bufferLayers = newLayers;
  };

  this.mouseoverHandler = (e) => {
    const f = !this.ctx.options.snapFeatureFilter
      ? e.features[0]
      : e.features.find(this.ctx.options.snapFeatureFilter);

    if (!f) {
      // mouse is over a feature we should ignore - just like it moved out
      this.mouseoutHandler();
      return;
    }

    if (this.snappedFeature) {
      if (this.snappedFeature.layer !== f.layer) {
        this.setSnapHoverState(this.snappedFeature, false);
      } else {
        return;
      }
    }
    // entering a new feature which we will snap to
    if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
      this.snappedGeometry = turf.polygonToLine(f.geometry).geometry;
    } else {
      this.snappedGeometry = f.geometry;
    }
    this.snappedFeature = f;
    this.setSnapHoverState(this.snappedFeature, true);
  };

  this.mouseoutHandler = () => {
    if (this.snappedFeature) {
      this.setSnapHoverState(this.snappedFeature, false);
      this.snappedGeometry = undefined;
      this.snappedFeature = undefined;
    }
  };
});

Snapping.prototype.setSnapHoverState = function (f, state) {
  if (f.id !== undefined) {
    this.map.setFeatureState(
      {
        id: f.id,
        source: f.source,
        ...(f.sourceLayer && { sourceLayer: f.sourceLayer }),
      },
      { "snap-hover": state }
    );
  }
};

function getBufferLayerId(layerId) {
  return `_snap_buffer_${layerId}`;
}

Snapping.prototype.addSnapBuffer = function (layerId) {
  console.log("snap on ", layerId);
  const bufferLayerId = getBufferLayerId(layerId);
  const layerDef = this.map.getLayer(layerId);
  if (!layerDef) {
    console.error(`Layer ${layerId} does not exist in map; can't snap to it.`);
    return;
  }
  const newLayer = {
    id: bufferLayerId,
    source: layerDef.source,
  };
  if (
    layerDef.type === "line" ||
    layerDef.type === "fill" ||
    layerDef.type === "fill-extrusion"
  ) {
    newLayer.type = "line";
  } else if (layerDef.type === "circle" || layerDef.type === "symbol") {
    newLayer.type = "circle";
  } else {
    console.error(
      `Unsupported snap layer type ${layerDef.type} for layer ${layerDef.id}`
    );
    return;
  }
  if (layerDef.sourceLayer) {
    newLayer["source-layer"] = layerDef.sourceLayer;
  }
  if (layerDef.filter) {
    newLayer.filter = layerDef.filter;
  }
  if (newLayer.type === "circle") {
    newLayer.paint = {
      "circle-color": "hsla(0,100%,50%,0.001)",
      "circle-radius": this.ctx.options.snapDistance,
    };
  } else {
    newLayer.paint = {
      "line-color": "hsla(0,100%,50%,0.001)",
      "line-width": this.ctx.options.snapDistance * 2,
    };
  }
  this.map.addLayer(newLayer);
  this.map.on("mousemove", bufferLayerId, this.mouseoverHandler);
  this.map.on("mouseout", bufferLayerId, this.mouseoutHandler);
};

Snapping.prototype.removeSnapBuffer = function (layerId) {
  const bufferLayerId = getBufferLayerId(layerId);
  this.map.off("mouseover", bufferLayerId, this.mouseoverHandler);
  this.map.off("mouseout", bufferLayerId, this.mouseoutHandler);
  this.map.removeLayer(bufferLayerId);
};

Snapping.prototype.enableSnapping = function () {
  console.log("snap on");
  this.snappableLayers().forEach((l) => this.addSnapBuffer(l));
  this.map.addSource("_snap_vertex", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });
  this.map.addLayer({
    // TODO rework into theme
    id: "_snap_vertex",
    type: "circle",
    source: "_snap_vertex",
    paint: {
      "circle-color": "transparent",
      "circle-radius": 5,
    },
  });
};

Snapping.prototype.disableSnapping = function () {
  this.snappableLayers().forEach((l) => this.removeSnapBuffer(l));
  this.map.removeLayer("_snap_vertex");
  this.map.removeSource("_snap_vertex");
};

Snapping.prototype.snappableLayers = function () {
  if (typeof this.ctx.options.snapLayers === "function") {
    return this.map
      .getStyle()
      .layers.filter(
        (l) => !l.id.match(/^_snap_/) && this.ctx.options.snapLayers(l)
      )
      .map((l) => l.id);
  } else {
    return this.ctx.options.snapLayers || [];
  }
};

Snapping.prototype.snapCoord = function snapCoord(lngLat, featureFilter) {
  if (
    this.snappedGeometry &&
    !(featureFilter && !featureFilter(this.snappedFeature))
  ) {
    const hoverPoint = {
      type: "Point",
      coordinates: [lngLat.lng, lngLat.lat],
    };
    let snapPoint;
    if (this.snappedGeometry.type === "Point") {
      snapPoint = { type: "Feature", geometry: this.snappedGeometry };
    } else {
      snapPoint = turf.nearestPointOnLine(this.snappedGeometry, hoverPoint);
    }
    this.map.getSource("_snap_vertex").setData(snapPoint);
    return {
      lng: snapPoint.geometry.coordinates[0],
      lat: snapPoint.geometry.coordinates[1],
      snapped: true,
      snappedFeature: this.snappedFeature,
    };
  } else {
    this.clearSnapCoord();
    return lngLat;
  }
};

Snapping.prototype.clearSnapCoord = function clearSnapCoord() {
  const source = this.map.getSource("_snap_vertex");
  if (source) {
    source.setData({ type: "FeatureCollection", features: [] });
  }
};
