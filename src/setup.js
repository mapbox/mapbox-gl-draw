var events = require('./events');
var Store = require('./store');
var ui = require('./ui');
var hat = require('hat');

var theme = require('./lib/theme');

module.exports = function(ctx) {

  ctx.events = events(ctx);

  ctx.map = null;
  ctx.container = null;
  ctx.store = null;
  ui(ctx);

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

      if (map.style.loaded()) { // not public
        ctx.events.addEventListeners();
        setup.addLayers();
      } else {
        map.on('load', () => {
          ctx.events.addEventListeners();
          setup.addLayers();
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

      for (let i = 0; i < theme.length; i++) {
        if (theme[i].id === undefined) theme[i] = hat();

        let style = JSON.parse(JSON.stringify(theme[i]));
        var id = style.id;

        if (style.source) {
          ctx.map.addLayer(style);
        }
        else {
          style.id = `${id}.hot`;
          style.source = 'mapbox-gl-draw-hot';
          ctx.map.addLayer(style);

          style.id = `${id}.cold`;
          style.source = 'mapbox-gl-draw-cold';
          ctx.map.addLayer(style);
        }
      }
      ctx.store.render();
    },
    removeLayers: function() {
      for (let i = 0; i < theme.length; i++) {
        let { id, source } = theme[i];
        if (source) {
          ctx.map.removeLayer(id);
        }
        else {
          ctx.map.removeLayer(`${id}.hot`);
          ctx.map.removeLayer(`${id}.cold`);
        }
      }

      ctx.map.removeSource('mapbox-gl-draw-cold');
      ctx.map.removeSource('mapbox-gl-draw-hot');
    }
  };

  return setup;
};
