import Point from 'point-geometry';
import doubleClickZoom from './double_click_zoom';
import dragPan from './drag_pan';

var ModeHandler = function(mode, ctx) {

  mode.dragPan = function(enable) {
    if (enable) {
      dragPan.enable(ctx);
    }
    else {
      dragPan.disable(ctx);
    }
  }

  mode.doubleClickZoom = function(enable) {
    if (enable) {
      doubleClickZoom.enable(ctx);
    }
    else {
      doubleClickZoom.disable(ctx);
    }
  }

  var children = [];

  mode.appendChild = function(child) {
    children.push(child);
    ctx.container.appendChild(child);
  }

  function delegate(action, event) {
    console.log(action);
    if (event.originalEvent) {
      const rect = ctx.container.getBoundingClientRect();
      event.mouseEventPoint = new Point(
        event.originalEvent.clientX - rect.left - ctx.container.clientLeft,
        event.originalEvent.clientY - rect.top - ctx.container.clientTop
      );
    }
    mode[action](event, ctx.store, ctx.ui);
    ctx.store.render();
    ctx.ui.updateMapClasses();
  }

  return {
    render: mode.render,
    stop: function() {
      // todo: clean up children
      if (mode.stop) mode.stop();
    },
    trash: function() {
      mode.onTrash();
      ctx.store.render();
    },
    drag: function(event) {
      delegate('onDrag', event);
    },
    click: function(event) {
      delegate('onClick', event);
    },
    mousemove: function(event) {
      delegate('onMousemove', event);
    },
    mousedown: function(event) {
      delegate('onMousedown', event);
    },
    mouseup: function(event) {
      delegate('onMouseup', event);
    },
    keydown: function(event) {
      delegate('onKeydown', event);
    },
    keyup: function(event) {
      delegate('onKeyup', event);
    }
  };
};

module.exports = ModeHandler;
