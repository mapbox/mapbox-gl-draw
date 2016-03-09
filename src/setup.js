var events = require('./events');
var store = require('./store');
var ui = require('./ui');

var drawSelectedTheme =  require('./theme/draw-selected');
var drawTheme =  require('./theme/draw');

module.exports = function(ctx) {

  ctx.events = events(ctx);
  ctx.map = null;
  ctx.container = null;
  ctx.store = null;
  ctx.ui = ui(ctx);

  var buttons = {};

  var setup = {
    addTo: function(map) {
        ctx.map = map;
        ctx.container = setup.onAdd(map);
        if (this.options && this.options.position) {
            var pos = this.options.position;
            var corner = map._controlCorners[pos];
            container.className += ' mapboxgl-ctrl';
            if (pos.indexOf('bottom') !== -1) {
                corner.insertBefore(container, corner.firstChild);
            } else {
                corner.appendChild(container);
            }
        }
        return this;
    },
    remove: function() {
        ctx.container.parentNode.removeChild(ctx.container);
        if (this.onRemove) this.onRemove(ctx.map);
        ctx.map = null;
        ctx.container = null;
        ctx.store = null;
        return this;
    },
    onAdd: function(map) {
      var container = DOM.create('div', 'mapboxgl-ctrl-group', map.getContainer());
      ctx.store = new Store(ctx);

      if (ctx.options.drawing) {
        ctx.ui.addButtons();
      }

      if (map.style.loaded()) { // not public
        setup.addEventListeners();
        setup.addLayers();
      } else {
        map.on('load', () => {
          setup.addEventListeners();
          setup.addLayers();
        });
      }

      return container;
    },
    remove: function() {
      setup.removeLayers();
      ctx.ui.removeButtons();
      setup.removeEventListeners();
    },
    addLayers: function() {
      ctx.map.batch((batch) => {
        // drawn features style
        batch.addSource('draw', {
          data: {
            type: 'FeatureCollection',
            features: []
          },
          type: 'geojson'
        });

        for (let i = 0; i < drawTheme.length; i++) {
          let style = drawTheme[i];
          Object.assign(style, this.options.styles[style.id] || {});
          batch.addLayer(style);
        }

        // selected features style
        batch.addSource('draw-selected', {
          data: {
            type: 'FeatureCollection',
            features: []
          },
          type: 'geojson'
        });

        for (let i = 0; i < drawSelectedTheme.length; i++) {
          let style = drawSelectedTheme[i];
          Object.assign(style, this.options.styles[style.id] || {});
          batch.addLayer(style);
        }
        ctx.store.render();
      });
    },
    removeLayers: function() {
      ctx.map.batch(function (batch) {
        for (let i = 0; i < drawTheme.length; i++) {
          let { id } = drawTheme[i];
          batch.removeLayer(id);
        }

        for (let i = 0; i < drawSelectedTheme.length; i++) {
          let { id } = drawSelectedTheme[i];
          batch.removeLayer(id);
        }

        batch.removeSource('draw');
        batch.removeSource('draw-selected');
      });
    }
  }

  return setup;
}
