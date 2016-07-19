var ModeHandler = require('./lib/mode_handler');
var getFeaturesAndSetCursor = require('./lib/get_features_and_set_cursor');
var isClick = require('./lib/is_click');
var Constants = require('./constants');

import SimpleSelectMode from './modes/simple_select';
import DirectSelectMode from './modes/direct_select';
import DrawPointMode from './modes/draw_point';
import DrawLineStringMode from './modes/draw_line_string';
import DrawPolygonMode from './modes/draw_polygon';
import StaticMode from './modes/static';


var modes = {
  [Constants.modes.SIMPLE_SELECT]: SimpleSelectMode,
  [Constants.modes.DIRECT_SELECT]: DirectSelectMode,
  [Constants.modes.DRAW_POINT]: DrawPointMode,
  [Constants.modes.DRAW_LINE_STRING]: DrawLineStringMode,
  [Constants.modes.DRAW_POLYGON]: DrawPolygonMode,
  [Constants.modes.STATIC]: StaticMode
};

module.exports = function(ctx) {

  var mouseDownInfo = {};
  var events = {};
  var currentModeName = Constants.modes.SIMPLE_SELECT;
  var currentMode = ModeHandler(new modes.simple_select(ctx.options, ctx.store, ctx.ui), ctx);

  events.drag = function(event) {
    if (isClick(mouseDownInfo, {
      point: event.point,
      time: new Date().getTime()
    })) {
      event.originalEvent.stopPropagation();
    }
    else {
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.DRAG });
      currentMode.drag(event);
    }
  };

  events.mousemove = function(event) {
    if (event.originalEvent.which === 1) {
      return events.drag(event);
    }
    var target = getFeaturesAndSetCursor(event, ctx);
    event.featureTarget = target;
    currentMode.mousemove(event);
  };

  events.mousedown = function(event) {
    mouseDownInfo = {
      time: new Date().getTime(),
      point: event.point
    };
    var target = getFeaturesAndSetCursor(event, ctx);
    event.featureTarget = target;
    currentMode.mousedown(event);
  };

  events.mouseup = function(event) {
    var target = getFeaturesAndSetCursor(event, ctx);
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

  // 8 - Backspace
  // 46 - Delete
  var isKeyModeValid = (code) => !(code === 8 || code === 46 || (code >= 48 && code <= 57));

  events.keydown = function(event) {
    if ((event.keyCode === 8 || event.keyCode === 46) && ctx.options.controls.trash) {
      event.preventDefault();
      currentMode.trash();
    }
    else if (isKeyModeValid(event.keyCode)) {
      currentMode.keydown(event);
    }
    else if (event.keyCode === 49 && ctx.options.controls.point) {
      changeMode(Constants.modes.DRAW_POINT);
    }
    else if (event.keyCode === 50 && ctx.options.controls.line_string) {
      changeMode(Constants.modes.DRAW_LINE_STRING);
    }
    else if (event.keyCode === 51 && ctx.options.controls.polygon) {
      changeMode(Constants.modes.DRAW_POLYGON);
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

  function changeMode(modename, nextModeOptions, eventOptions = {}) {
    currentMode.stop();

    var modebuilder = modes[modename];
    if (modebuilder === undefined) {
      throw new Error(`${modename} is not valid`);
    }
    currentModeName = modename;
    var mode = new modebuilder(ctx.options, ctx.store, ctx.ui);
    currentMode = ModeHandler(mode, ctx);

    if (!eventOptions.silent) {
      ctx.map.fire(Constants.events.MODE_CHANGE, { mode: modename});
    }

    ctx.store.setDirty();
    ctx.store.render();
  }

  var api = {
    changeMode,
    currentModeName: function() {
      return currentModeName;
    },
    currentModeRender: function(geojson, push) {
      return currentMode.render(geojson, push);
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
    },
    trash: function(options) {
      currentMode.trash(options);
    },
    getMode: function() {
      return currentModeName;
    }
  };

  return api;
};
