
module.exports = function(ctx) {

  var isDown = false;

  var events = {};

  events.onDrag = function() {}
  events.onClick = function() {}
  events.onDoubleClick = function() {}
  events.onMouseMove  = function() {
    if (isDown) {
      events.onDrag();
    }
    else {

    }
  }
  events.onMouseDown  = function() {
    isDown = true;
  }
  events.onMouseUp  = function() {
    isDown = false;
  }
  events.onKeyDown  = function() {}
  events.onKeyUp  = function() {
    if(ctx.options.keybindings) {
      // do more than normal
    }
    else {
      // handle enter and escape when we need too anyway
    }
  }

  return {
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
}
