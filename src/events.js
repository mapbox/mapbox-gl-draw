var ModeHandler = require('./lib/mode_handler');
var getFeatureAtAndSetCursors = require('./lib/get_features_and_set_cursor');
var isClick = require('./lib/is_click');
var Constants = require('./constants');

var modes = {
  [Constants.modes.SIMPLE_SELECT]: require('./modes/simple_select'),
  [Constants.modes.DIRECT_SELECT]: require('./modes/direct_select'),
  [Constants.modes.DRAW_POINT]: require('./modes/draw_point'),
  [Constants.modes.DRAW_LINE]: require('./modes/draw_line_string'),
  [Constants.modes.DRAW_POLYGON]: require('./modes/draw_polygon')
};

module.exports = function(ctx) {

  var mouseDownInfo = {
    isDown: false
  };

  var events = {};
  var currentModeName = Constants.modes.SIMPLE_SELECT;
  var currentMode = ModeHandler(modes.simple_select(ctx), ctx);

  events.drag = function(event) {
    if (isClick(mouseDownInfo, {
      point: event.point,
      time: new Date().getTime()
    })) {
      event.originalEvent.stopPropagation();
    }
    else {
      ctx.ui.queueMapClasses({mouse: 'drag'});
      currentMode.drag(event);
    }
  };

  events.mousemove = function(event) {
    if (mouseDownInfo.isDown) {
      events.drag(event);
    }
    else {
      var target = getFeatureAtAndSetCursors(event, ctx);
      event.featureTarget = target;
      currentMode.mousemove(event);
    }
  };

  events.mousedown = function(event) {
    mouseDownInfo = {
      isDown: true,
      time: new Date().getTime(),
      point: event.point
    };
    var target = getFeatureAtAndSetCursors(event, ctx);
    event.featureTarget = target;
    currentMode.mousedown(event);
  };

  events.mouseup = function(event) {
    mouseDownInfo.isDown = false;
    var target = getFeatureAtAndSetCursors(event, ctx);
    event.featureTarget = target;

    if (isClick(mouseDownInfo, {
      point: event.point,
      time: new Date().getTime()
    })) {
      currentMode.click(event);
    }
    else {
      currentMode.mouseup(event);
    }
  };

  events.trash = function() {
    currentMode.trash();
  };

  // 8 - Backspace
  // 46 - Delete
  var isKeyModeValid = (code) => !(code === 8 || code === 46 || (code >= 48 && code <= 57));

  events.keydown = function(event) {
    if ((event.keyCode === 8 || event.keyCode === 46) && ctx.options.controls.trash) {
      event.preventDefault();
      api.fire('trash');
    }
    else if (isKeyModeValid(event.keyCode)) {
      currentMode.keydown(event);
    }
    else if (event.keyCode === 49 && ctx.options.controls.point) {
      ctx.api.changeMode(Constants.modes.DRAW_POINT);
    }
    else if (event.keyCode === 50 && ctx.options.controls.line_string) {
      ctx.api.changeMode(Constants.modes.DRAW_LINE);
    }
    else if (event.keyCode === 51 && ctx.options.controls.polygon) {
      ctx.api.changeMode(Constants.modes.DRAW_POLYGON);
    }
  };

  events.keyup = function(event) {
    if (isKeyModeValid(event.keyCode)) {
      currentMode.keyup(event);
    }
  };

  events.zoomend = function() {
    ctx.store.changeZoom();
  };

  var api = {
    currentModeName: function() {
      return currentModeName;
    },
    currentModeRender: function(geojson, push) {
      return currentMode.render(geojson, push);
    },
    changeMode: function(modename, opts) {
      currentMode.stop();

      var modebuilder = modes[modename];
      if (modebuilder === undefined) {
        throw new Error(`${modename} is not valid`);
      }
      currentModeName = modename;
      var mode = modebuilder(ctx, opts);
      currentMode = ModeHandler(mode, ctx);

      ctx.map.fire(Constants.events.MODE_CHANGE, {
        mode: modename
      });

      ctx.store.setDirty();
      ctx.store.render();

    },
    fire: function(name, event) {
      if (events[name]) {
        events[name](event);
      }
    },
    addEventListeners: function() {
      ctx.map.on('mousemove', events.mousemove);

      ctx.map.on('mousedown', events.mousedown);
      ctx.map.on('mouseup', events.mouseup);

      if (ctx.options.keybindings) {
        ctx.container.addEventListener('keydown', events.keydown);
        ctx.container.addEventListener('keyup', events.keyup);
      }
    },
    removeEventListeners: function() {
      ctx.map.off('mousemove', events.mousemove);

      ctx.map.off('mousedown', events.mousedown);
      ctx.map.off('mouseup', events.mouseup);

      if (ctx.options.keybindings) {
        ctx.container.removeEventListener('keydown', events.keydown);
        ctx.container.removeEventListener('keyup', events.keyup);
      }
    }
  };

  return api;
};
