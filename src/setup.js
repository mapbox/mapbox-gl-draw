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
      ctx.map.batch((batch) => {
        // drawn features style
        batch.addSource('mapbox-gl-draw-cold', {
          data: {
            type: 'FeatureCollection',
            features: []
          },
          type: 'geojson'
        });

        // hot features style
        batch.addSource('mapbox-gl-draw-hot', {
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
            batch.addLayer(style);
          }
          else {
            style.id = `${id}.hot`;
            style.source = 'mapbox-gl-draw-hot';
            batch.addLayer(style);

            style.id = `${id}.cold`;
            style.source = 'mapbox-gl-draw-cold';
            batch.addLayer(style);
          }
        }
        ctx.store.render();
      });
    },
    removeLayers: function() {
      ctx.map.batch(function (batch) {
        for (let i = 0; i < theme.length; i++) {
          let { id, source } = theme[i];
          if (source) {
            batch.removeLayer(id);
          }
          else {
            batch.removeLayer(`${id}.hot`);
            batch.removeLayer(`${id}.cold`);
          }
        }

        batch.removeSource('mapbox-gl-draw-cold');
        batch.removeSource('mapbox-gl-draw-hot');
      });
    }
  };

  return setup;
};
