const Constants = require('./constants');

const classTypes = ['mode', 'feature', 'mouse'];

module.exports = function(ctx) {

  const buttonElements = {};
  let activeButton = null;

  const currentMapClasses = {
    mode: null, // e.g. mode-direct_select
    feature: null, // e.g. feature-vertex
    mouse: null // e.g. mouse-move
  };

  const nextMapClasses = {
    mode: null,
    feature: null,
    mouse: null
  };

  function queueMapClasses(options) {
    Object.assign(nextMapClasses, options);
  }

  function updateMapClasses() {
    if (!ctx.container) return;

    const classesToRemove = [];
    const classesToAdd = [];

    classTypes.forEach(function(type) {
      if (nextMapClasses[type] === currentMapClasses[type]) return;

      classesToRemove.push(`${type}-${currentMapClasses[type]}`);
      if (nextMapClasses[type] !== null) {
        classesToAdd.push(`${type}-${nextMapClasses[type]}`);
      }
    });

    ctx.container.classList.remove.apply(ctx.container.classList, classesToRemove);
    ctx.container.classList.add.apply(ctx.container.classList, classesToAdd);

    Object.assign(currentMapClasses, nextMapClasses);
  }

  function createControlButton(id, options = {}) {
    const button = document.createElement('button');
    button.className = `${Constants.CONTROL_BUTTON_CLASS} ${options.className}`;
    button.setAttribute('title', options.title);
    options.container.appendChild(button);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clickedButton = e.target;
      if (clickedButton === activeButton) {
        deactivateButtons();
        return;
      }

      setButtonActive(id);
      options.onActivate();
    }, true);

    return button;
  }

  function deactivateButtons() {
    if (!activeButton) return;
    activeButton.classList.remove(Constants.ACTIVE_BUTTON_CLASS);
    activeButton = null;
  }

  function setButtonActive(id) {
    const button = buttonElements[id];
    if (!button) return;

    deactivateButtons();
    if (button && id !== 'trash') {
      button.classList.add('active');
      activeButton = button;
    }
  }

  function addButtons() {
    const controls = ctx.options.controls;
    if (!controls) return;

    const ctrlPosClassName = `mapboxgl-ctrl-${ctx.options.position || 'top-left'}`;
    const controlContainer = ctx.container.getElementsByClassName(ctrlPosClassName)[0];
    let controlGroup = controlContainer.getElementsByClassName(Constants.CONTROL_GROUP_CLASS)[0];

    if (!controlGroup) {
      controlGroup = document.createElement('div');
      controlGroup.className = `${Constants.CONTROL_GROUP_CLASS} mapboxgl-ctrl`;

      const attributionControl = controlContainer.getElementsByClassName(Constants.ATTRIBUTION_CLASS)[0];
      if (attributionControl) {
        controlContainer.insertBefore(controlGroup, attributionControl);
      } else {
        controlContainer.appendChild(controlGroup);
      }
    }

    if (controls[Constants.types.LINE]) {
      buttonElements[Constants.types.LINE] = createControlButton(Constants.types.LINE, {
        container: controlGroup,
        className: Constants.CONTROL_BUTTON_LINE_CLASS,
        title: `LineString tool ${ctx.options.keybindings && '(l)'}`,
        onActivate: () => ctx.api.changeMode(Constants.modes.DRAW_LINE)
      });
    }

    if (controls[Constants.types.POLYGON]) {
      buttonElements[Constants.types.POLYGON] = createControlButton(Constants.types.POLYGON, {
        container: controlGroup,
        className: Constants.CONTROL_BUTTON_POLYGON_CLASS,
        title: `Polygon tool ${ctx.options.keybindings && '(p)'}`,
        onActivate: () => ctx.api.changeMode(Constants.modes.DRAW_POLYGON)
      });
    }

    if (controls[Constants.types.POINT]) {
      buttonElements[Constants.types.POINT] = createControlButton(Constants.types.POINT, {
        container: controlGroup,
        className: Constants.CONTROL_BUTTON_POINT_CLASS,
        title: `Marker tool ${ctx.options.keybindings && '(m)'}`,
        onActivate: () => ctx.api.changeMode(Constants.modes.DRAW_POINT)
      });
    }

    if (controls.trash) {
      buttonElements.trash = createControlButton('trash', {
        container: controlGroup,
        className: Constants.CONTROL_BUTTON_TRASH_CLASS,
        title: 'Delete',
        onActivate: () => {
          ctx.api.trash();
        }
      });
    }
  }

  function removeButtons() {
    Object.keys(buttonElements).forEach(buttonId => {
      const button = buttonElements[buttonId];
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
      delete buttonElements[buttonId];
    });
  }

  return {
    setButtonActive,
    deactivateButtons,
    queueMapClasses,
    updateMapClasses,
    addButtons,
    removeButtons
  };
};
