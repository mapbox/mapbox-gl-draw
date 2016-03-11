var ModeHandler = function(mode) {

  var handlers = {
    onDrag: [],
    onClick: [],
    onDoubleClick: [],
    onMouseMove: [],
    onMouseDown: [],
    onMouseUp: [],
    onKeyDown: [],
    onKeyUp: [],
    reset: []
  };

  var lastClass = '';

  var ctx = {
    on: function(event, selector, fn) {
      handlers[event].push({
        selector: selector,
        fn: fn
      });
    },
    off: function(event, selector, fn) {
      handlers[event] = handlers[event].filter(handler => {
        return handler.selector !== selector || handler.fn !== fn;
      });
    }
  }

  function delegate(eventName, event) {
    var handles = handlers[eventName];
    var iHandle = handles.length;
    while (iHandle--) {
      var handle = handles[iHandle];
      if (handle.selector(event)) {
        handle.fn.call(ctx, event);
        break;
      }
    }
  }

  mode.start.call(ctx);

  return {
    stop: mode.stop || function() {},
    onDrag: function(event) {
      delegate('onDrag', event);
    },
    onClick: function(event) {
      delegate('onClick', event);
    },
    onDoubleClick: function(event) {
      delegate('onDoubleClick', event);
    },
    onMouseMove: function(event) {
      delegate('onMouseMove', event);
    },
    onMouseDown: function(event) {
      delegate('onMouseDown', event);
    },
    onMouseUp: function(event) {
      delegate('onMouseUp', event);
    },
    onKeyDown: function(event) {
      delegate('onKeyDown', event);
    },
    onKeyUp: function(event) {
      delegate('onKeyUp', event);
    }
  }
}

module.exports  = ModeHandler;
