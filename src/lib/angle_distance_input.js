/**
 * Shared Angle/Distance Input UI Module
 *
 * Creates and manages the distance and angle input UI components used across
 * direct_select, draw_line_string_distance, and draw_polygon_distance modes.
 */

/**
 * Create the distance input UI
 * @param {Object} ctx - The draw context
 * @param {Object} state - The mode state
 * @param {Object} options - Configuration options
 * @param {Function} options.shouldActivateKeyHandler - Returns true when D key should work
 * @param {Function} [options.onEnter] - Called when Enter is pressed in input
 * @param {Function} [options.onBackspace] - Called when Backspace is pressed on empty input
 * @param {boolean} [options.initiallyHidden=false] - Whether container starts hidden
 * @param {boolean} [options.forceCreate=false] - Skip useAngleDistanceInput check
 */
export function createDistanceInput(ctx, state, options = {}) {
  const {
    shouldActivateKeyHandler = () => true,
    onEnter = null,
    onBackspace = null,
    initiallyHidden = false,
    forceCreate = false
  } = options;

  if (!forceCreate && !ctx.options.useAngleDistanceInput) {
    return null;
  }

  // Create main container
  const container = document.createElement('div');
  container.className = 'mapbox-gl-draw-angle-distance-container';

  const [leftPos, topPos] = ctx.options.angleDistanceInputPosition;
  container.style.cssText = `
    position: absolute;
    top: ${topPos};
    left: ${leftPos};
  `;

  // Create section wrapper
  const section = document.createElement('div');
  section.className = 'mapbox-gl-draw-section';

  // Create label with key badge
  const label = document.createElement('span');
  label.className = 'mapbox-gl-draw-label';
  label.innerHTML = '<span class="key">L</span><span class="text">Length</span>';

  // Create input wrapper
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'mapbox-gl-draw-input-wrapper';

  // Create input group (input + unit)
  const inputGroup = document.createElement('div');
  inputGroup.className = 'mapbox-gl-draw-input-group';

  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'mapbox-gl-draw-input';

  // Create unit suffix
  const unit = document.createElement('span');
  unit.className = 'mapbox-gl-draw-input-unit';
  unit.textContent = 'm';

  // Create clear button (subtle, on right)
  const clearBtn = document.createElement('button');
  clearBtn.innerHTML = '×';
  clearBtn.className = 'mapbox-gl-draw-clear';

  inputGroup.appendChild(input);
  inputGroup.appendChild(unit);
  inputWrapper.appendChild(inputGroup);
  inputWrapper.appendChild(clearBtn);

  // Click on label activates input mode
  label.addEventListener('click', () => {
    label.classList.add('hidden');
    inputWrapper.classList.add('active');
    input.focus();
  });

  const updateDisplay = () => {
    if (state.currentDistance !== null && state.currentDistance > 0) {
      label.classList.add('hidden');
      inputWrapper.classList.add('active');
    } else {
      label.classList.remove('hidden');
      inputWrapper.classList.remove('active');
    }
  };

  input.addEventListener('focus', () => {
    input.classList.add('focused');
  });

  input.addEventListener('blur', () => {
    input.classList.remove('focused');
  });

  input.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(parseFloat(value))) {
      state.currentDistance = value === '' ? null : parseFloat(value);
      updateDisplay();
    } else {
      e.target.value = state.currentDistance !== null ? state.currentDistance.toString() : '';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.stopPropagation();
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (onEnter) onEnter();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      state.currentDistance = null;
      input.value = '';
      input.blur();
      updateDisplay();
    }
  });

  clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.currentDistance = null;
    input.value = '';
    input.blur();
    updateDisplay();
  });

  const keyHandler = (e) => {
    if (!shouldActivateKeyHandler()) {
      return;
    }

    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      e.stopPropagation();

      if (state.currentDistance !== null || document.activeElement === input) {
        state.currentDistance = null;
        input.value = '';
        input.blur();
        updateDisplay();
      } else {
        label.classList.add('hidden');
        inputWrapper.classList.add('active');
        input.focus();
      }
    }
  };
  document.addEventListener('keydown', keyHandler);

  section.appendChild(label);
  section.appendChild(inputWrapper);
  container.appendChild(section);
  ctx.map.getContainer().appendChild(container);

  if (initiallyHidden) {
    container.style.display = 'none';
  }

  state.distanceInput = input;
  state.distanceContainer = container;
  state.distanceSection = section;
  state.distanceKeyHandler = keyHandler;
  state.distanceUpdateDisplay = updateDisplay;

  updateDisplay();

  return {
    container,
    section,
    input,
    label,
    clearBtn,
    updateDisplay,
    keyHandler
  };
}

/**
 * Create the angle input UI (appends to distance container)
 * @param {Object} ctx - The draw context
 * @param {Object} state - The mode state
 * @param {Object} options - Configuration options
 * @param {Function} options.shouldActivateKeyHandler - Returns true when A key should work
 * @param {Function} [options.onEnter] - Called when Enter is pressed in input
 * @param {Function} [options.onBackspace] - Called when Backspace is pressed on empty input
 * @param {boolean} [options.forceCreate=false] - Skip useAngleDistanceInput check
 */
export function createAngleInput(ctx, state, options = {}) {
  const {
    shouldActivateKeyHandler = () => true,
    onEnter = null,
    onBackspace = null,
    forceCreate = false
  } = options;

  if (!forceCreate && !ctx.options.useAngleDistanceInput) {
    return null;
  }

  const distanceContainer = state.distanceContainer;
  if (!distanceContainer) {
    return null;
  }

  // Create separator
  const separator = document.createElement('span');
  separator.className = 'mapbox-gl-draw-input-separator';

  // Create section wrapper
  const section = document.createElement('div');
  section.className = 'mapbox-gl-draw-section';

  // Create label with key badge
  const label = document.createElement('span');
  label.className = 'mapbox-gl-draw-label';
  label.innerHTML = '<span class="key">A</span><span class="text">Angle</span>';

  // Create input wrapper
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'mapbox-gl-draw-input-wrapper';

  // Create input group (input + unit)
  const inputGroup = document.createElement('div');
  inputGroup.className = 'mapbox-gl-draw-input-group';

  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'mapbox-gl-draw-input';

  // Create unit suffix
  const unit = document.createElement('span');
  unit.className = 'mapbox-gl-draw-input-unit';
  unit.textContent = '°';

  // Create clear button (subtle, on right)
  const clearBtn = document.createElement('button');
  clearBtn.innerHTML = '×';
  clearBtn.className = 'mapbox-gl-draw-clear';

  inputGroup.appendChild(input);
  inputGroup.appendChild(unit);
  inputWrapper.appendChild(inputGroup);
  inputWrapper.appendChild(clearBtn);

  // Click on label activates input mode
  label.addEventListener('click', () => {
    label.classList.add('hidden');
    inputWrapper.classList.add('active');
    input.focus();
  });

  const updateDisplay = () => {
    if (state.currentAngle !== null && !isNaN(state.currentAngle)) {
      label.classList.add('hidden');
      inputWrapper.classList.add('active');
    } else {
      label.classList.remove('hidden');
      inputWrapper.classList.remove('active');
    }
  };

  input.addEventListener('focus', () => {
    input.classList.add('focused');
  });

  input.addEventListener('blur', () => {
    input.classList.remove('focused');
  });

  input.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(parseFloat(value))) {
      state.currentAngle = value === '' ? null : parseFloat(value);
      updateDisplay();
    } else {
      e.target.value = state.currentAngle !== null ? state.currentAngle.toString() : '';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.stopPropagation();
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (onEnter) onEnter();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      state.currentAngle = null;
      input.value = '';
      input.blur();
      updateDisplay();
    }
  });

  clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.currentAngle = null;
    input.value = '';
    input.blur();
    updateDisplay();
  });

  const keyHandler = (e) => {
    if (!shouldActivateKeyHandler()) {
      return;
    }

    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      e.stopPropagation();

      if (state.currentAngle !== null || document.activeElement === input) {
        state.currentAngle = null;
        input.value = '';
        input.blur();
        updateDisplay();
      } else {
        label.classList.add('hidden');
        inputWrapper.classList.add('active');
        input.focus();
      }
    }
  };
  document.addEventListener('keydown', keyHandler);

  distanceContainer.appendChild(separator);
  section.appendChild(label);
  section.appendChild(inputWrapper);
  distanceContainer.appendChild(section);

  state.angleInput = input;
  state.angleSection = section;
  state.angleKeyHandler = keyHandler;
  state.angleSeparator = separator;
  state.angleUpdateDisplay = updateDisplay;

  updateDisplay();

  return {
    separator,
    section,
    input,
    label,
    clearBtn,
    updateDisplay,
    keyHandler
  };
}

/**
 * Show the distance/angle input UI
 * @param {Object} state - The mode state
 */
export function showDistanceAngleUI(state) {
  if (state.distanceContainer) {
    state.distanceContainer.style.display = 'flex';
  }
}

/**
 * Hide the distance/angle input UI and clear values
 * @param {Object} state - The mode state
 */
export function hideDistanceAngleUI(state) {
  if (state.distanceContainer) {
    state.distanceContainer.style.display = 'none';
  }
  if (state.distanceInput) {
    state.distanceInput.value = '';
    state.currentDistance = null;
    if (state.distanceUpdateDisplay) state.distanceUpdateDisplay();
  }
  if (state.angleInput) {
    state.angleInput.value = '';
    state.currentAngle = null;
    if (state.angleUpdateDisplay) state.angleUpdateDisplay();
  }
}

/**
 * Create the snapping indicator UI (appends to distance container)
 * Shows whether snapping is enabled or disabled based on Shift key state
 * Supports locking the disabled state by clicking while Shift is held
 * Lock state persists between drawings via ctx.snappingLocked
 * @param {Object} ctx - The draw context
 * @param {Object} state - The mode state
 * @param {Object} options - Configuration options
 * @param {boolean} [options.forceCreate=false] - Skip useAngleDistanceInput check
 */
export function createSnappingIndicator(ctx, state, options = {}) {
  const { forceCreate = false } = options;

  if (!forceCreate && !ctx.options.useAngleDistanceInput) {
    return null;
  }

  const distanceContainer = state.distanceContainer;
  if (!distanceContainer) {
    return null;
  }

  // Create separator
  const separator = document.createElement('span');
  separator.className = 'mapbox-gl-draw-input-separator';

  // Create label with key badge
  const label = document.createElement('span');
  label.className = 'mapbox-gl-draw-snapping-label';
  const keySpan = document.createElement('span');
  keySpan.className = 'key';
  keySpan.textContent = '⇧';
  const textSpan = document.createElement('span');
  textSpan.className = 'text';
  textSpan.textContent = 'Snap';
  label.appendChild(keySpan);
  label.appendChild(textSpan);

  let shiftHeld = false;
  let isHovering = false;

  const ICON_SHIFT = '⇧';
  const ICON_LOCKED = '\u{1F512}\u{FE0E}';
  const ICON_UNLOCKED = '\u{1F513}\u{FE0E}';

  const updateLabel = () => {
    const isLocked = ctx.snappingLocked || false;
    label.classList.remove('disabled', 'locked', 'hover-lock', 'hover-unlock');

    if (isLocked) {
      label.classList.add('locked');
      if (isHovering) {
        label.classList.add('hover-unlock');
        keySpan.textContent = ICON_UNLOCKED;
      } else {
        keySpan.textContent = ICON_LOCKED;
      }
      if (ctx.snapping) {
        ctx.snapping.setDisabled(true);
      }
    } else if (shiftHeld) {
      label.classList.add('disabled');
      if (isHovering) {
        label.classList.add('hover-lock');
        keySpan.textContent = ICON_LOCKED;
      } else {
        keySpan.textContent = ICON_SHIFT;
      }
      if (ctx.snapping) {
        ctx.snapping.setDisabled(true);
      }
    } else {
      keySpan.textContent = ICON_SHIFT;
      if (ctx.snapping) {
        ctx.snapping.setDisabled(false);
      }
    }
  };

  const keydownHandler = (e) => {
    if (e.key === 'Shift' && !ctx.snappingLocked) {
      shiftHeld = true;
      updateLabel();
    }
  };

  const keyupHandler = (e) => {
    if (e.key === 'Shift') {
      shiftHeld = false;
      if (!ctx.snappingLocked) {
        updateLabel();
      }
    }
  };

  const mouseenterHandler = () => {
    isHovering = true;
    updateLabel();
  };

  const mouseleaveHandler = () => {
    isHovering = false;
    updateLabel();
  };

  // Click to lock/unlock
  const clickHandler = () => {
    if (ctx.snappingLocked) {
      ctx.snappingLocked = false;
      updateLabel();
    } else if (shiftHeld) {
      ctx.snappingLocked = true;
      updateLabel();
    }
  };

  label.addEventListener('click', clickHandler);
  label.addEventListener('mouseenter', mouseenterHandler);
  label.addEventListener('mouseleave', mouseleaveHandler);
  document.addEventListener('keydown', keydownHandler);
  document.addEventListener('keyup', keyupHandler);

  distanceContainer.appendChild(separator);
  distanceContainer.appendChild(label);

  state.snappingIndicatorSeparator = separator;
  state.snappingIndicatorLabel = label;
  state.snappingKeydownHandler = keydownHandler;
  state.snappingKeyupHandler = keyupHandler;
  state.snappingClickHandler = clickHandler;
  state.snappingMouseenterHandler = mouseenterHandler;
  state.snappingMouseleaveHandler = mouseleaveHandler;
  state.snappingCtx = ctx;

  // Initialize display based on persisted lock state
  updateLabel();

  return {
    separator,
    label,
    keydownHandler,
    keyupHandler,
    updateLabel
  };
}

/**
 * Remove the distance/angle input UI elements and clean up event listeners
 * @param {Object} state - The mode state
 */
export function removeDistanceAngleUI(state) {
  if (state.distanceKeyHandler) {
    document.removeEventListener('keydown', state.distanceKeyHandler);
    state.distanceKeyHandler = null;
  }
  if (state.angleKeyHandler) {
    document.removeEventListener('keydown', state.angleKeyHandler);
    state.angleKeyHandler = null;
  }
  if (state.snappingKeydownHandler) {
    document.removeEventListener('keydown', state.snappingKeydownHandler);
    state.snappingKeydownHandler = null;
  }
  if (state.snappingKeyupHandler) {
    document.removeEventListener('keyup', state.snappingKeyupHandler);
    state.snappingKeyupHandler = null;
  }
  if (state.snappingIndicatorLabel) {
    if (state.snappingClickHandler) {
      state.snappingIndicatorLabel.removeEventListener('click', state.snappingClickHandler);
      state.snappingClickHandler = null;
    }
    if (state.snappingMouseenterHandler) {
      state.snappingIndicatorLabel.removeEventListener('mouseenter', state.snappingMouseenterHandler);
      state.snappingMouseenterHandler = null;
    }
    if (state.snappingMouseleaveHandler) {
      state.snappingIndicatorLabel.removeEventListener('mouseleave', state.snappingMouseleaveHandler);
      state.snappingMouseleaveHandler = null;
    }
  }
  if (state.snappingCtx && state.snappingCtx.snapping && !state.snappingCtx.snappingLocked) {
    state.snappingCtx.snapping.setDisabled(false);
  }
  state.snappingCtx = null;
  if (state.distanceContainer && state.distanceContainer.parentNode) {
    state.distanceContainer.parentNode.removeChild(state.distanceContainer);
    state.distanceContainer = null;
  }
  state.distanceInput = null;
  state.distanceSection = null;
  state.angleInput = null;
  state.angleSection = null;
  state.snappingIndicatorSeparator = null;
  state.snappingIndicatorLabel = null;
}
