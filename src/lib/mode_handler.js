
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
    on(event, selector, fn) {
      if (handlers[event] === undefined) {
        throw new Error(`Invalid event type: ${event}`);
      }
      handlers[event].push({
        selector,
        fn
      });
    },
    render(id) {
      DrawContext.store.featureChanged(id);
    }
  };

  const delegate = function (eventName, event) {
    const handles = handlers[eventName];
    let iHandle = handles.length;
    while (iHandle--) {
      const handle = handles[iHandle];
      if (handle.selector(event)) {
        const skipRender = handle.fn.call(ctx, event);
        if (!skipRender) {
          DrawContext.store.render();
        }
        DrawContext.ui.updateMapClasses();

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
    stop() {
      if (mode.stop) mode.stop();
    },
    trash() {
      if (mode.trash) {
        mode.trash();
        DrawContext.store.render();
      }
    },
    combineFeatures() {
      if (mode.combineFeatures) {
        mode.combineFeatures();
      }
    },
    uncombineFeatures() {
      if (mode.uncombineFeatures) {
        mode.uncombineFeatures();
      }
    },
    drag(event) {
      delegate('drag', event);
    },
    click(event) {
      delegate('click', event);
    },
    mousemove(event) {
      delegate('mousemove', event);
    },
    mousedown(event) {
      delegate('mousedown', event);
    },
    mouseup(event) {
      delegate('mouseup', event);
    },
    mouseout(event) {
      delegate('mouseout', event);
    },
    keydown(event) {
      delegate('keydown', event);
    },
    keyup(event) {
      delegate('keyup', event);
    },
    touchstart(event) {
      delegate('touchstart', event);
    },
    touchmove(event) {
      delegate('touchmove', event);
    },
    touchend(event) {
      delegate('touchend', event);
    },
    tap(event) {
      delegate('tap', event);
    }
  };
};

export default ModeHandler;
