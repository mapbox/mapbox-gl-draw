var ModeHandler = require('./modes/mode_handler');
var browse = require('./modes/browse');
var findTaragetAt = require('./lib/find_target_at');

module.exports = function(ctx) {

  var isDown = false;

  var events = {};
  var currentMode = ModeHandler(browse(ctx));

  events.onDrag = function(event) {
    currentMode.onDrag(event);
  };

  events.onClick = function(event) {
    findTaragetAt(event, ctx, function(target) {
      event.target = target;
      currentMode.onClick(event);
    });
  };

  events.onDoubleClick = function(event) {
    findTaragetAt(event, ctx, function(target) {
      event.target = target;
      currentMode.onDoubleClick(event);
    });
  };

  events.onMouseMove  = function(event) {
    if (isDown) {
      events.onDrag(event);
    }
    else {
      findTaragetAt(event, ctx, function(target) {
        event.target = target;
        currentMode.onMouseMove(event);
      });
    }
  };

  events.onMouseDown  = function(event) {
    isDown = true;
    findTaragetAt(event, ctx, function(target) {
      event.target = target;
      currentMode.onMouseDown(event);
    });
  };

  events.onMouseUp  = function(event) {
    isDown = false;
    findTaragetAt(event, ctx, function(target) {
      event.target = target;
      currentMode.onMouseUp(event);
    });
  };

  events.onKeyDown  = function(event) {
    currentMode.onKeyDown(event);
  };

  events.onKeyUp  = function(event) {
    currentMode.onKeyUp(event);
  }

  var api = {
    startMode: function(mode) {
      currentMode.stop();
      currentMode = ModeHandler(mode);
    },
    stopMode: function() {
      api.startMode(browse(ctx));
    },
    addEventListeners: function() {
      ctx.map.on('click', events.onClick);
      ctx.map.on('dblclick', events.onDoubleClick);
      ctx.map.on('mousemove', events.onMouseMove);

      ctx.container.addEventListener('mousedown', events.onMouseDown);
      ctx.container.addEventListener('mouseup', events.onMouseUp);

      ctx.container.addEventListener('keydown', events.onKeyDown);
      ctx.container.addEventListener('keyup', events.onKeyUp);
    },
    removeEventListeners: function() {
      ctx.map.off('click', events.onClick);
      ctx.map.off('dblclick', events.onDoubleClick);
      ctx.map.off('mousemove', events.onMouseMove);
      ctx.container.removeEventListener('mousedown', events.onMouseDown);
      ctx.container.removeEventListener('mouseup', events.onMouseUp);
      ctx.container.removeEventListener('keydown', events.onKeyDown);
      ctx.container.removeEventListener('keyup', events.onKeyUp);
    }
  }

  return api;
}
