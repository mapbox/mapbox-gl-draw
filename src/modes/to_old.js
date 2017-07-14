const Constants = require('../constants');
const featuresAt = require('../lib/features_at');
const Point = require('../feature_types/point');
const LineString = require('../feature_types/line_string');
const Polygon = require('../feature_types/polygon');
const MultiFeature = require('../feature_types/multi_feature');

module.exports = function(mode) {
  if (mode.toDisplayFeatures === undefined) throw new Error("modes must have a toDisplayFeatures function");

  return function(ctx, startOpts = {}) {
    let state = {};
    // add default methods onto mode
    mode.setSelected = function(features) {
      return ctx.store.setSelected(features);
    };

    mode.setSelectedCoordinates = function(coords) {
      ctx.store.setSelectedCoordinates(coords);
      coords.reduce((m, c) => {
        if (m[c.feature_id] === undefined) {
          m[c.feature_id] = true;
          ctx.store.get(c.feature_id).changed();
        }
        return m;
      }, {});
    };

    mode.getSelected = function() {
      return ctx.store.getSelected();
    };

    mode.getSelectedIds = function() {
      return ctx.store.getSelectedIds();
    };

    mode.isSelected = function(id) {
      return ctx.store.isSelected(id);
    };

    mode.getFeature = function(id) {
      return ctx.store.get(id);
    };

    mode.select = function(id) {
      return ctx.store.select(id);
    };

    mode.deselect = function(id) {
      return ctx.store.deselect(id);
    };

    mode.deleteFeature = function(id) {
      return ctx.store.delete(id);
    };

    mode.addFeature = function(feature) {
      return ctx.store.add(feature);
    };

    mode.clearSelectedFeatures = function() {
      return ctx.store.clearSelected();
    };

    mode.clearSelectedCoordinates = function() {
      return ctx.store.clearSelectedCoordinates();
    };

    mode.setActionableState = function(actions) {
      return ctx.events.actionable(actions);
    };

    mode.changeMode = function(mode, opts) {
      return ctx.events.changeMode(mode, opts);
    };

    mode.updateUIClasses = function(opts) {
      return ctx.ui.queueMapClasses(opts);
    };

    mode.featuresAt = function(event, bbox, bufferType = 'click') {
      if (bufferType !== 'click' && bufferType !== 'touch') throw new Error('invalid buffer type');
      return featuresAt[bufferType](event, bbox, ctx);
    };

    mode.newFeature = function(geojson) {
      const type = geojson.geometry.type;
      if (type === Constants.geojsonTypes.POINT) return new Point(ctx, geojson);
      if (type === Constants.geojsonTypes.LINE_STRING) return new LineString(ctx, geojson);
      if (type === Constants.geojsonTypes.POLYGON) return new Polygon(ctx, geojson);
      return new MultiFeature(ctx, geojson);
    };

    mode.isInstanceOf = function(type, feature) {
      if (type === Constants.geojsonTypes.POINT) return feature instanceof Point;
      if (type === Constants.geojsonTypes.LINE_STRING) return feature instanceof LineString;
      if (type === Constants.geojsonTypes.POLYGON) return feature instanceof Polygon;
      if (type === 'MultiFeature') return feature instanceof MultiFeature;
      throw new Error(`Unknown feature class: ${type}`);
    };

    mode.doRender = function(id) {
      return ctx.store.featureChanged(id);
    };

    mode.map = ctx.map;
    mode.drawConfig = JSON.parse(JSON.stringify(ctx.options));

    function wrapper(eh) {
      return function(e) {
        eh.call(mode, state, e);
      };
    }

    return {
      start: function() {
        if (mode.setup) state = mode.setup(startOpts); // this should set ui buttons
        if (mode.onDrag) this.on('drag', () => true, wrapper(mode.onDrag));
        if (mode.onClick) this.on('click', () => true, wrapper(mode.onClick));
        if (mode.onMouseMove) this.on('mousemove', () => true, wrapper(mode.onMouseMove));
        if (mode.onMouseDown) this.on('mousedown', () => true, wrapper(mode.onMouseDown));
        if (mode.onMouseUp) this.on('mouseup', () => true, wrapper(mode.onMouseUp));
        if (mode.onMouseOut) this.on('mouseout', () => true, wrapper(mode.onMouseOut));
        if (mode.onKeyUp) this.on('keyup', () => true, wrapper(mode.onKeyUp));
        if (mode.onKeyDown) this.on('keydown', () => true, wrapper(mode.onKeyDown));
        if (mode.onTouchStart) this.on('touchstart', () => true, wrapper(mode.onTouchStart));
        if (mode.onTouchMove) this.on('touchmove', () => true, wrapper(mode.onTouchMove));
        if (mode.onTouchEnd) this.on('touchend', () => true, wrapper(mode.onTouchEnd));
        if (mode.onTap) this.on('tap', () => true, wrapper(mode.onTap));
      },
      stop: function() {
        if (mode.onStop) {
          mode.onStop(state);
        }
      },
      trash: function() {
        if (mode.onTrash) {
          mode.onTrash(state);
        }
      },
      combineFeatures: function() {
        if (mode.onCombineFeatures) {
          mode.onCombineFeatures(state);
        }
      },
      uncombineFeatures: function() {
        if (mode.onUncombineFeatures) {
          mode.onUncombineFeatures(state);
        }
      },
      render: function(geojson, push) {
        mode.toDisplayFeatures(state, geojson, push);
      }
    };
  };
};
