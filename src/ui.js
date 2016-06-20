const types = require('./lib/types');
const createControlButton = require('./lib/create_control_button');

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
  };

  ctx.ui = {
    setClass: function(opts) {
        classTypes.forEach(type => {
        if (opts[type]) {
          nextClass[type] = opts[type];
        }
      });
    },
    fireClassUpdate: function() {
      var equal = Object.keys(nextClass).some(k => {
        return currentClass[k] !== nextClass[k];
      });

      if (equal) {
        update();
      }
    },
    addButtons: function() {
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

        if (controls[types.LINE]) {
          buttons[types.LINE] = createControlButton({
            container: controlGroup,
            className: 'mapbox-gl-draw_line',
            title: `LineString tool ${ctx.options.keybindings && '(l)'}`,
            onActivate: () => ctx.api.changeMode('draw_line_string')
          });
        }

        if (controls[types.POLYGON]) {
          buttons[types.POLYGON] = createControlButton({
            container: controlGroup,
            className: 'mapbox-gl-draw_polygon',
            title: `Polygon tool ${ctx.options.keybindings && '(p)'}`,
            onActivate: () => ctx.api.changeMode('draw_polygon')
          });
        }

        if (controls[types.POINT]) {
          buttons[types.POINT] = createControlButton({
            container: controlGroup,
            className: 'mapbox-gl-draw_point',
            title: `Marker tool ${ctx.options.keybindings && '(m)'}`,
            onActivate: () => ctx.api.changeMode('draw_point')
          });
        }

        if (controls.trash) {
          buttons.trash = createControlButton({
            container: controlGroup,
            className: 'mapbox-gl-draw_trash',
            title: 'Delete',
            onActivate: () => {
              ctx.api.trash();
              ctx.ui.setButtonInactive('trash');
            }
          });
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
