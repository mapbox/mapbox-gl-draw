var ModeHandler = require('./modes/mode_handler');
console.log('events require manySelect', typeof manySelect);
var findTargetAt = require('./lib/find_target_at');

var modes = {
  'many_select': require('./modes/many_features/select'),
  'many_drag': require('./modes/many_features/drag'),
  'draw_line_string': require('./modes/draw_feature/line_string'),
  'draw_point': require('./modes/draw_feature/point'),
  'draw_polygon': require('./modes/draw_feature/polygon'),
  'one_select': require('./modes/one_feature/select'),
  'one_drag': require('./modes/one_feature/drag')
}

module.exports = function(ctx) {

  var isDown = false;

  var events = {};
  var currentMode = ModeHandler(modes['many_select'](ctx));

  events.drag = function(event) {
    currentMode.drag(event);
  };

  events.click = function(event) {
    findTargetAt(event, ctx, function(target) {
      event.featureTarget = target;
      currentMode.click(event);
    });
  };

  events.doubleclick = function(event) {
    findTargetAt(event, ctx, function(target) {
      event.featureTarget = target;
      currentMode.doubleclick(event);
    });
  };

  events.mousemove  = function(event) {
    if (isDown) {
      events.drag(event);
    }
    else {
      findTargetAt(event, ctx, function(target) {
        event.featureTarget = target;
        currentMode.mousemove(event);
      });
    }
  };

  events.mousedown  = function(event) {
    isDown = true;
    findTargetAt(event, ctx, function(target) {
      event.featureTarget = target;
      currentMode.mousedown(event);
    });
  };

  events.mouseup  = function(event) {
    isDown = false;
    findTargetAt(event, ctx, function(target) {
      event.featureTarget = target;
      currentMode.mouseup(event);
    });
  };

  events.delete = function(event) {
    currentMode.delete(event);
  }

  events.keydown  = function(event) {
    currentMode.keydown(event);
  };

  events.keyup  = function(event) {
    currentMode.keyup(event);
  }

  var api = {
    startMode: function(modename, opts) {
      currentMode.stop();
      var modebuilder = modes[modename];
      if (modebuilder === undefined) {
        throw new Error(`${modename} is not valid`);
      }
      var mode = modebuilder(ctx, opts);
      currentMode = ModeHandler(mode);
      ctx.store.render();
    },
    fire: function(name, event) {
      if (events[name]) {
        events[name](event);
      }
    },
    addEventListeners: function() {
      ctx.map.on('click', events.click);
      ctx.map.on('dblclick', events.doubleclick);
      ctx.map.on('mousemove', events.mousemove);

      ctx.map.on('mousedown', events.mousedown);
      ctx.map.on('mouseup', events.mouseup);

      ctx.container.addEventListener('keydown', events.keydown);
      ctx.container.addEventListener('keyup', events.keyup);
    },
    removeEventListeners: function() {
      ctx.map.off('click', events.click);
      ctx.map.off('dblclick', events.doubleclick);
      ctx.map.off('mousemove', events.mousemove);
      ctx.container.removeEventListener('mousedown', events.mousedown);
      ctx.container.removeEventListener('mouseup', events.mouseup);
      ctx.container.removeEventListener('keydown', events.keydown);
      ctx.container.removeEventListener('keyup', events.keyup);
    }
  }

  return api;
}
