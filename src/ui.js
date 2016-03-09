const types = require('./types');

module.exports = function(ctx) {

  var buttons = {};

  var api = {
    addButtons: function() {
      var controlClass = 'mapbox-gl-draw_ctrl-draw-btn';
      var controls = ctx.options.controls;

      if (controls.line) {
        buttons[types.LINE] = createButton(ctx.container, {
          className: `${controlClass} mapbox-gl-draw_line`,
          title: `LineString tool ${ctx.options.keybindings && '(l)'}`,
          fn: ctx.api.startDrawing.bind(this, types.LINE),
          id: 'lineDrawBtn'
        }, controlClass);
      }

      if (controls[types.POLYGON]) {
        buttons[types.POLYGON] = createButton(ctx.container, {
          className: `${controlClass} mapbox-gl-draw_shape`,
          title: `Polygon tool ${ctx.options.keybindings && '(p)'}`,
          fn: ctx.api.startDrawing.bind(this, types.POLYGON),
          id: 'polygonDrawBtn'
        }, controlClass);
      }

      if (controls[types.SQUARE]) {
        buttons[types.SQUARE] = createButton(ctx.container, {
          className: `${controlClass} mapbox-gl-draw_square`,
          title: `Square tool ${ctx.options.keybindings && '(s)'}`,
          fn: ctx.api.startDrawing.bind(this, types.SQUARE),
          id: 'squareDrawBtn'
        }, controlClass);
      }

      if (controls[types.POINT]) {
        buttons[types.POINT] = createButton(ctx.container, {
          className: `${controlClass} mapbox-gl-draw_marker`,
          title: `Marker tool ${ctx.options.keybindings && '(m)'}`,
          fn: ctx.api.startDrawing.bind(this, types.POINT),
          id: 'pointDrawBtn'
        }, controlClass);
      }

      if (controls.trash) {
        buttons.trash = createButton(ctx.container, {
          className: `${controlClass} mapbox-gl-draw_trash`,
          title: 'delete',
          fn: ctx.api.destroy.bind(this),
          id: 'deleteBtn'
        }, controlClass);

        setup.hideButton('trash');
      }
    },
    hideButton: function(id) {
      if (buttons[id]) {
        buttons[id].style.display = 'none';
      }
    },
    showButton: function (id) {
      if (buttons[id]) {
        buttons[id].style.display = 'block';
      }
    },
    setButtonActive: function(id) {
      if (buttons[id] && id !== 'trash') {
        buttons[id].classList.add('active');
      }
    },
    setAllInactive: function(id) {
      var buttonIds = Object.keys(buttons);

      buttonIds.forEach(buttonId => {
        if (buttonId !== 'trash') {
          var button = buttons[buttonId];
          button.classList.remove('active');
        }
      });
    },
    removeButtons: function() {
      var buttonIds = Object.keys(buttons);

      buttonIds.forEach(buttonId => {
        var button = buttons[buttonId];
        button.parentNode.removeChild(button);
        buttons[buttonId] = null;
      });
    }
  }

  return api;
}
