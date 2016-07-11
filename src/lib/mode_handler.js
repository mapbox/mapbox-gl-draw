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
    on: function(event, fn) {
      if (handlers[event] === undefined) {
        throw new Error(`Invalid event type: ${event}`);
      }
      handlers[event].push(fn);
    },
    render: function(id) {
      DrawContext.store.featureChanged(id);
    }
  };

  var delegate = function (eventName, event) {
    handlers[eventName].forEach(handle => {
      handle.call(ctx, event);
    });

    if (handlers[eventName].length > 0) {
      DrawContext.store.render();
      DrawContext.ui.updateMapClasses();
    }
  };

  mode.start.call(ctx);

  return {
    render: mode.render,
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
