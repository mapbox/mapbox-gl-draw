var ModeHandler = function(mode, DrawContext) {

  var handlers = {
    drag: [],
    click: [],
    mousemove: [],
    mousedown: [],
    mouseup: [],
    keydown: [],
    keyup: []
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
    render: function(id) {
      DrawContext.store.featureChanged(id);
    }
  };

  var delegate = function (eventName, event) {
    var handles = handlers[eventName];
    var iHandle = handles.length;
    var handlerCalled = false;
    while (iHandle--) {
      var handle = handles[iHandle];
      if (handle.selector(event)) {
        handle.fn.call(ctx, event);
        handlerCalled = true;
      }
    }
    if (handlerCalled) {
      DrawContext.store.render();
      DrawContext.ui.updateMapClasses();
    }
  };

  mode.start.call(ctx);

  return {
    render: mode.render || function(geojson) {return geojson; },
    stop: function() {
      if (mode.stop) mode.stop();
    },
    trash: function() {
      if (mode.trash) {
        mode.trash();
        DrawContext.store.render();
      }
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
    }
  };
};

module.exports = ModeHandler;
