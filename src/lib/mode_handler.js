function throttle(func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};
  var later = function() {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function() {
    var now = Date.now();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
}

const ModeHandler = function(mode, DrawContext) {

  const handlers = {
    drag: [],
    click: [],
    mousemove: [],
    mousedown: [],
    mouseup: [],
    mouseout: [],
    keydown: [],
    keyup: [],
    touchstart: [],
    touchmove: [],
    touchend: [],
    tap: []
  };

  const ctx = {
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

  const delegate = function (eventName, event) {
    const handles = handlers[eventName];
    let iHandle = handles.length;
    while (iHandle--) {
      const handle = handles[iHandle];
      if (handle.selector(event)) {
        handle.fn.call(ctx, event);

        if (
          DrawContext.api.getMode() === 'simple_select'
          && (
            eventName === 'mousemove'
            || eventName === 'drag' && !DrawContext.api.getSelectedIds().length
          )
        ) {
          return;
        }

        window.requestAnimationFrame(() => {
          DrawContext.store.render();
          DrawContext.ui.updateMapClasses();
        });

        // ensure an event is only handled once
        // we do this to let modes have multiple overlapping selectors
        // and relay on order of oppertations to filter
        break;
      }
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
    combineFeatures: function() {
      if (mode.combineFeatures) {
        mode.combineFeatures();
      }
    },
    uncombineFeatures: function() {
      if (mode.uncombineFeatures) {
        mode.uncombineFeatures();
      }
    },
    drag: throttle(function(event) {
      delegate('drag', event);
    }, 16.6),
    click: function(event) {
      delegate('click', event);
    },
    mousemove: throttle(function(event) {
      delegate('mousemove', event);
    }, 16.6),
    mousedown: function(event) {
      delegate('mousedown', event);
    },
    mouseup: function(event) {
      delegate('mouseup', event);
    },
    mouseout: function(event) {
      delegate('mouseout', event);
    },
    keydown: function(event) {
      delegate('keydown', event);
    },
    keyup: function(event) {
      delegate('keyup', event);
    },
    touchstart: function(event) {
      delegate('touchstart', event);
    },
    touchmove: function(event) {
      delegate('touchmove', event);
    },
    touchend: function(event) {
      delegate('touchend', event);
    },
    tap: function(event) {
      delegate('tap', event);
    }
  };
};

module.exports = ModeHandler;
