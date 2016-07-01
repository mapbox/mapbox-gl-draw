var events = require('./events');
var Store = require('./store');
var ui = require('./ui');

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
        ctx.events.initialize();
      } else {
        map.on('load', () => {
          setup.addLayers();
          ctx.events.initialize();
        });
      }
    },
    addLayers: function() {
      // drawn features style
      ctx.map.addSource('mapbox-gl-draw-cold', {
        data: {
          type: 'FeatureCollection',
          features: []
        },
        type: 'geojson'
      });

      // hot features style
      ctx.map.addSource('mapbox-gl-draw-hot', {
        data: {
          type: 'FeatureCollection',
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

      ctx.map.removeSource('mapbox-gl-draw-cold');
      ctx.map.removeSource('mapbox-gl-draw-hot');
    }
  };

  return setup;
};
