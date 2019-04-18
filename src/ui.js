const xtend = require('xtend');
const Constants = require('./constants');

const classTypes = ['mode', 'feature', 'mouse'];

module.exports = function(ctx) {

  const defaultControls = {
    [Constants.types.LINE]: {
      type: Constants.types.LINE,
      className: Constants.classes.CONTROL_BUTTON_LINE,
      title: options => `LineString tool ${options.keybindings ? '(l)' : ''}`,
      onActivate: ctx => ctx.events.changeMode(Constants.modes.DRAW_LINE_STRING),
    },
    [Constants.types.POLYGON]: {
      type: Constants.types.POLYGON,
      className: Constants.classes.CONTROL_BUTTON_POLYGON,
      title: options => `Polygon tool ${options.keybindings ? '(p)' : ''}`,
      onActivate: ctx => ctx.events.changeMode(Constants.modes.DRAW_POLYGON),
    },
    [Constants.types.POINT]: {
      type: Constants.types.POINT,
      className: Constants.classes.CONTROL_BUTTON_POINT,
      title: options => `Marker tool ${options.keybindings ? '(m)' : ''}`,
      onActivate: ctx => ctx.events.changeMode(Constants.modes.DRAW_POINT),
    },
    trash: {
      type: 'trash',
      className: Constants.classes.CONTROL_BUTTON_TRASH,
      title: 'Delete',
      onActivate: ctx => ctx.events.trash(),
    },
    combine_features: {
      type: 'combine_features', // Constants.types.LINE
      className: Constants.classes.CONTROL_BUTTON_COMBINE_FEATURES,
      title: 'Combine',
      onActivate: ctx => ctx.events.combineFeatures(),
    },
    uncombine_features: {
      type: 'uncombine_features', // Constants.types.LINE
      className: Constants.classes.CONTROL_BUTTON_UNCOMBINE_FEATURES,
      title: 'Uncombine',
      onActivate: ctx => ctx.events.uncombineFeatures(),
    }
  };

  const buttonElements = {};
  let activeButton = null;

  let currentMapClasses = {
    mode: null, // e.g. mode-direct_select
    feature: null, // e.g. feature-vertex
    mouse: null // e.g. mouse-move
  };

  let nextMapClasses = {
    mode: null,
    feature: null,
    mouse: null
  };

  function clearMapClasses() {
    queueMapClasses({mode:null, feature:null, mouse:null});
    updateMapClasses();
  }

  function queueMapClasses(options) {
    nextMapClasses = xtend(nextMapClasses, options);
  }

  function updateMapClasses() {
    if (!ctx.container) return;

    const classesToRemove = [];
    const classesToAdd = [];

    classTypes.forEach((type) => {
      if (nextMapClasses[type] === currentMapClasses[type]) return;

      classesToRemove.push(`${type}-${currentMapClasses[type]}`);
      if (nextMapClasses[type] !== null) {
        classesToAdd.push(`${type}-${nextMapClasses[type]}`);
      }
    });

    if (classesToRemove.length > 0) {
      ctx.container.classList.remove.apply(ctx.container.classList, classesToRemove);
    }

    if (classesToAdd.length > 0) {
      ctx.container.classList.add.apply(ctx.container.classList, classesToAdd);
    }

    currentMapClasses = xtend(currentMapClasses, nextMapClasses);
  }

  function createControlButton(id, options = {}) {
    const button = document.createElement('button');
    button.className = `${Constants.classes.CONTROL_BUTTON} ${options.className}`;
    button.setAttribute('title', options.title);
    if (options.icon) {
      button.setAttribute('style', `background-image: url(${options.icon}); background-size: contain;`);
    }
    options.container.appendChild(button);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clickedButton = e.target;
      if (clickedButton === activeButton) {
        deactivateButtons();
        return;
      }

      setActiveButton(id);
      options.onActivate();
    }, true);

    return button;
  }

  function deactivateButtons() {
    if (!activeButton) return;
    activeButton.classList.remove(Constants.classes.ACTIVE_BUTTON);
    activeButton = null;
  }

  function setActiveButton(id) {
    deactivateButtons();

    const button = buttonElements[id];
    if (!button) return;

    if (button && id !== 'trash') {
      button.classList.add(Constants.classes.ACTIVE_BUTTON);
      activeButton = button;
    }
  }

  function addButtons() {
    const controls = ctx.options.controls;
    const controlGroup = document.createElement('div');
    controlGroup.className = `${Constants.classes.CONTROL_GROUP} ${Constants.classes.CONTROL_BASE}`;
    let controlBar = [];
    if (!controls) return controlGroup;

    if (String(controls) === '[object Object]') {
      Object.keys(controls).forEach(key => {
        const val = controls[key];
        if (typeof val === 'boolean' && val) {
          controlBar.push(key);
        }
        if (String(val) === '[object Object]') {
          val.type = key;
          controlBar.push(val);
        }
      });
    }

    if (Array.isArray(controls)) {
      controlBar = [...controls];
    }

    controlBar.forEach(c => {
      const control = typeof c === 'string' ? defaultControls[c] : c;
      if (!control) return;
      buttonElements[control.type] = createControlButton(control.type, {
        container: controlGroup,
        className: control.className,
        title: typeof control.title === 'function' ?
          control.title(ctx.options) : control.title,
        onActivate: () => control.onActivate(ctx),
        icon: control.icon
      });
    });

    return controlGroup;
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
    setActiveButton,
    queueMapClasses,
    updateMapClasses,
    clearMapClasses,
    addButtons,
    removeButtons
  };
};
