var ModeHandler = function(mode, DrawContext) {

  var handlers = {
    drag: [],
    click: [],
    mousemove: [],
    mousedown: [],
    mouseup: [],
    keydown: [],
    keyup: [],
    trash: []
  };

  var ctx = {
    on: function(event, selector, fn) {
      if (handlers[event] === undefined) {
        throw new Error(`Invalid event type: ${event}`);
      }
      handlers[event].push({
        selector: selector,
        fn: fn
      });
    },
    off: function(event, selector, fn) {
      handlers[event] = handlers[event].filter(handler => {
        return handler.selector !== selector || handler.fn !== fn;
      });
    },
    fire: function(event, payload) {
      var modename = DrawContext.events.currentModeName();
      DrawContext.map.fire(`draw.${modename}.${event}`, payload);
    },
    render: function(id) {
      DrawContext.store.featureChanged(id);
    }
  };

  var delegate = function (eventName, event) {
    var handles = handlers[eventName];
    var iHandle = handles.length;
    while (iHandle--) {
      var handle = handles[iHandle];
      if (handle.selector(event)) {
        handle.fn.call(ctx, event);
        DrawContext.store.render();
        break;
      }
    }
    DrawContext.ui.fireClassUpdate();
  };

  mode.start.call(ctx);

  return {
    render: mode.render || function(geojson) {return geojson; },
    stop: function() {
      if (mode.stop) mode.stop();
      DrawContext.store.clearSelected();
    },
    drag: function(event) {
      delegate('drag', event);
    },
    click: function(event) {
      delegate('click', event);
    },
    mousemove: function(event) {
      delegate('mousemove', event);
    },
    mousedown: function(event) {
      delegate('mousedown', event);
    },
    mouseup: function(event) {
      delegate('mouseup', event);
    },
    keydown: function(event) {
      delegate('keydown', event);
    },
    keyup: function(event) {
      delegate('keyup', event);
    },
    trash: function(event) {
      delegate('trash', event);
    }
  };
};

module.exports = ModeHandler;
