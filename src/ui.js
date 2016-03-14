const types = require('./lib/types');
var {createButton, DOM} = require('./lib/util');

module.exports = function(ctx) {

  var buttons = {};

  var lastClass = undefined;

  ctx.ui = {
    setClass: function(nextClass) {
      if(lastClass !== undefined) {
        ctx.container.classList.remove(lastClass);
      }

      if(nextClass !== undefined) {
        ctx.container.classList.add(nextClass);
      }

      lastClass = nextClass;
    },
    clearClass: function() {
      ctx.ui.setClass();
    },
    addButtons: function() {
      var controlClass = 'mapbox-gl-draw_ctrl-draw-btn';
      var controls = ctx.options.controls;
      var ctrlPos = 'mapboxgl-ctrl-top-left';

      let controlContainer = ctx.container.getElementsByClassName(ctrlPos)[0].getElementsByClassName('mapboxgl-ctrl-group')[0];

      if (controls.line) {
        buttons[types.LINE] = createButton(controlContainer, {
          className: `${controlClass} mapbox-gl-draw_line`,
          title: `LineString tool ${ctx.options.keybindings && '(l)'}`,
          fn: () => ctx.api.startDrawing(types.LINE)
        }, controlClass);
      }

      if (controls[types.POLYGON]) {
        buttons[types.POLYGON] = createButton(controlContainer, {
          className: `${controlClass} mapbox-gl-draw_polygon`,
          title: `Polygon tool ${ctx.options.keybindings && '(p)'}`,
          fn: () => ctx.api.startDrawing(types.POLYGON)
        }, controlClass);
      }

      if (controls[types.POINT]) {
        buttons[types.POINT] = createButton(controlContainer, {
          className: `${controlClass} mapbox-gl-draw_point`,
          title: `Marker tool ${ctx.options.keybindings && '(m)'}`,
          fn: () => ctx.api.startDrawing(types.POINT)
        }, controlClass);
      }

      if (controls.trash) {
        buttons.trash = createButton(controlContainer, {
          className: `${controlClass} mapbox-gl-draw_trash`,
          title: 'delete',
          fn: function() {
            ctx.api.deleteSelected();
          },
        }, controlClass);

        ctx.ui.hideButton('trash');
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
}
