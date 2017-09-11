const events = require('./events');
const Store = require('./store');
const ui = require('./ui');
const Constants = require('./constants');

module.exports = function(ctx) {

  let controlContainer = null;
  let mapLoadedInterval = null;

  const setup = {
    onRemove: function() {
      // Stop connect attempt in the event that control is removed before map is loaded
      ctx.map.off('load', setup.connect);
      clearInterval(mapLoadedInterval);

      setup.removeLayers();
      ctx.ui.removeButtons();
      ctx.events.removeEventListeners();
      ctx.map = null;
      ctx.container = null;
      ctx.store = null;

      if (controlContainer && controlContainer.parentNode) controlContainer.parentNode.removeChild(controlContainer);
      controlContainer = null;

      return this;
    },
    connect: function() {
      ctx.map.off('load', setup.connect);
      clearInterval(mapLoadedInterval);
      setup.addLayers();
      ctx.events.addEventListeners();
    },
    onAdd: function(map) {
      ctx.map = map;
      ctx.events = events(ctx);
      ctx.ui = ui(ctx);
      ctx.container = map.getContainer();
      ctx.store = new Store(ctx);

      controlContainer = ctx.ui.addButtons();

      if (ctx.options.boxSelect) {
        map.boxZoom.disable();
        // Need to toggle dragPan on and off or else first
        // dragPan disable attempt in simple_select doesn't work
        map.dragPan.disable();
        map.dragPan.enable();
      }

      if (map.loaded()) {
        setup.connect();
      } else {
        map.on('load', setup.connect);
        mapLoadedInterval = setInterval(() => { if (map.loaded()) setup.connect(); }, 16);
      }

      ctx.events.start();
      return controlContainer;
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
    // Check for layers and sources before attempting to remove
    // If user adds draw control and removes it before the map is loaded, layers and sources will be missing
    removeLayers: function() {
      ctx.options.styles.forEach(style => {
        if (ctx.map.getLayer(style.id)) {
          ctx.map.removeLayer(style.id);
        }
      });

      if (ctx.map.getSource(Constants.sources.COLD)) {
        ctx.map.removeSource(Constants.sources.COLD);
      }

      if (ctx.map.getSource(Constants.sources.HOT)) {
        ctx.map.removeSource(Constants.sources.HOT);
      }
    }
  };

  ctx.setup = setup;

  return setup;
};
