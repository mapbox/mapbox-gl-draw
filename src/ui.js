const types = require('./lib/types');
var {createButton} = require('./lib/util');

module.exports = function(ctx) {

  var buttons = {};

  var currentClass = {
    mode: null,
    feature: null,
    mouse: null
  };

  var nextClass = {
    mode: null,
    feature: null,
    mouse: null
  };

  var classTypes = ['mode', 'feature', 'mouse'];

  let update = () => {
    if (ctx.container) {

      var remove = [];
      var add = [];

      var className = [];

      nextClass.feature = nextClass.mouse === 'none' ? null : nextClass.feature;

      classTypes.forEach(function(type) {
        className.push(type + '-' + nextClass[type]);
        if (nextClass[type] !== currentClass[type]) {
          remove.push(type + '-' + currentClass[type]);
          if (nextClass[type] !== null) {
            add.push(type + '-' + nextClass[type]);
          }
        }
      });

      if (remove.length) {
        ctx.container.classList.remove.apply(ctx.container.classList, remove);
        ctx.container.classList.add.apply(ctx.container.classList, add);
      }

      classTypes.forEach(type => {
        currentClass[type] = nextClass[type];
      });
    }
  }

  ctx.ui = {
    setClass: function(opts) {
        classTypes.forEach(type => {
        if (opts[type]) {
          nextClass[type] = opts[type];
          if (nextClass[type] !== currentClass[type]) {
            update();
          }
        }
      });
    },
    addButtons: function() {
      var controlClass = 'mapbox-gl-draw_ctrl-draw-btn';
      var controls = ctx.options.controls;
      var ctrlPos = 'mapboxgl-ctrl-';
        switch (ctx.options.position) {
          case 'top-left':
          case 'top-right':
          case 'bottom-left':
          case 'bottom-right':
            ctrlPos += ctx.options.position;
            break;
          default:
            ctrlPos += 'top-left';
        }

        let controlContainer = ctx.container.getElementsByClassName(ctrlPos)[0];
        let controlGroup = controlContainer.getElementsByClassName('mapboxgl-ctrl-group')[0];
        if (!controlGroup) {
          controlGroup = document.createElement('div');
          controlGroup.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';

          let attributionControl = controlContainer.getElementsByClassName('mapboxgl-ctrl-attrib')[0];
          if (attributionControl) {
            controlContainer.insertBefore(controlGroup, attributionControl);
          }
          else {
            controlContainer.appendChild(controlGroup);
          }
        }

        if (controls.line_string) {
          buttons[types.LINE] = createButton(controlGroup, {
            className: `${controlClass} mapbox-gl-draw_line`,
            title: `LineString tool ${ctx.options.keybindings && '(l)'}`,
            fn: () => ctx.api.changeMode('draw_line_string')
          }, controlClass);
        }

        if (controls[types.POLYGON]) {
          buttons[types.POLYGON] = createButton(controlGroup, {
            className: `${controlClass} mapbox-gl-draw_polygon`,
            title: `Polygon tool ${ctx.options.keybindings && '(p)'}`,
            fn: () => ctx.api.changeMode('draw_polygon')
          }, controlClass);
        }

        if (controls[types.POINT]) {
          buttons[types.POINT] = createButton(controlGroup, {
            className: `${controlClass} mapbox-gl-draw_point`,
            title: `Marker tool ${ctx.options.keybindings && '(m)'}`,
            fn: () => ctx.api.changeMode('draw_point')
          }, controlClass);
        }

        if (controls.trash) {
          buttons.trash = createButton(controlGroup, {
            className: `${controlClass} mapbox-gl-draw_trash`,
            title: 'delete',
            fn: function() {
              ctx.api.trash();
              ctx.ui.setButtonInactive('trash');
            }
          }, controlClass);
        }
      },
      setButtonActive: function(id) {
        if (buttons[id] && id !== 'trash') {
            buttons[id].classList.add('active');
        }
      },
      setButtonInactive: function(id) {
        if (buttons[id]) {
          buttons[id].classList.remove('active');
        }
      },
      setAllInactive: function() {
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
          if (button.parentNode) {
            button.parentNode.removeChild(button);
          }
          buttons[buttonId] = null;
        });
      }
    };
};
