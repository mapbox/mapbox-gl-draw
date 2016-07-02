var events = require('./events');
var Store = require('./store');
var ui = require('./ui');
var Constants = require('./constants');

module.exports = function(ctx) {

  ctx.events = events(ctx);

  ctx.map = null;
  ctx.container = null;
  ctx.store = null;
  ctx.ui = ui(ctx);

  var setup = {
    addTo: function(map) {
        ctx.map = map;
        setup.onAdd(map);
        return this;
    },
    remove: function() {
      setup.removeLayers();
      ctx.ui.removeButtons();
      ctx.events.removeEventListeners();
      ctx.map = null;
      ctx.container = null;
      ctx.store = null;
      return this;
    },
    onAdd: function(map) {
      ctx.container = map.getContainer();
      ctx.store = new Store(ctx);

      ctx.ui.addButtons();

      if (ctx.options.boxSelect) {
        map.boxZoom.disable();
        // Need to toggle dragPan on and off or else first
        // dragPan disable attempt in simple_select doesn't work
        map.dragPan.disable();
        map.dragPan.enable();
      }

      if (map.loaded()) {
        setup.addLayers();
        ctx.events.addEventListeners();
      } else {
        map.on('load', () => {
          setup.addLayers();
          ctx.events.addEventListeners();
        });
      }
    },
    addLayers: function() {
      // drawn features style
      ctx.map.addSource(Constants.sources.COLD, {
        data: {
          type: Constants.geojsonTypes.FEATURE_COLLECTION,
          features: []
        },
        type: 'geojson'
      });

      // hot features style
      ctx.map.addSource(Constants.sources.HOT, {
        data: {
          type: Constants.geojsonTypes.FEATURE_COLLECTION,
          features: []
        },
        type: 'geojson'
      });

      ctx.options.styles.forEach(style => {
        ctx.map.addLayer(style);
      });

      ctx.store.render();
    },
    removeLayers: function() {
      ctx.options.styles.forEach(style => {
        ctx.map.removeLayer(style.id);
      });

      ctx.map.removeSource(Constants.sources.COLD);
      ctx.map.removeSource(Constants.sources.HOT);
    }
  };

  return setup;
};
