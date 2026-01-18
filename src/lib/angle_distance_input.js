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

  // Check if angle/distance input UI is enabled (skip check if forceCreate is true)
  if (!forceCreate && !ctx.options.useAngleDistanceInput) {
    return null;
  }

  // Create container
  const container = document.createElement('div');
  container.className = 'mapbox-gl-draw-angle-distance-container';

  // Get position values from options (rem or any CSS units)
  const [leftPos, topPos] = ctx.options.angleDistanceInputPosition;

  // Set critical inline styles (CSS classes can override for customization)
  container.style.cssText = `
    position: fixed;
    top: ${topPos};
    left: ${leftPos};
  `;

  // Create label/state display
  const label = document.createElement('span');
  label.className = 'mapbox-gl-draw-label';
  label.textContent = '[L] Length';

  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Length [m]';
  input.className = 'mapbox-gl-draw-input';

  // Create clear button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'x';
  clearBtn.className = 'mapbox-gl-draw-clear';

  const updateDisplay = () => {
    if (state.currentDistance !== null && state.currentDistance > 0) {
      label.style.display = 'none';
      input.style.display = 'block';
      clearBtn.style.display = 'block';
    } else {
      label.style.display = 'inline-block';
      input.style.display = 'none';
      clearBtn.style.display = 'none';
    }
  };

  // Add focus/blur handlers
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
    // Prevent event from bubbling to map
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

  // Add keyboard shortcuts
  const keyHandler = (e) => {
    // Only respond when conditions are met
    if (!shouldActivateKeyHandler()) {
      return;
    }

    // 'L' key to toggle distance input
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      e.stopPropagation();

      // Toggle: if distance is active, clear it; otherwise activate it
      if (state.currentDistance !== null || document.activeElement === input) {
        state.currentDistance = null;
        input.value = '';
        input.blur();
        updateDisplay();
      } else {
        input.style.display = 'block';
        label.style.display = 'none';
        input.focus();
      }
    }
  };
  document.addEventListener('keydown', keyHandler);

  container.appendChild(label);
  container.appendChild(input);
  container.appendChild(clearBtn);
  document.body.appendChild(container);

  // Hide initially if requested
  if (initiallyHidden) {
    container.style.display = 'none';
  }

  // Store references in state
  state.distanceInput = input;
  state.distanceContainer = container;
  state.distanceKeyHandler = keyHandler;
  state.distanceUpdateDisplay = updateDisplay;

  updateDisplay();

  return {
    container,
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

  // Check if angle/distance input UI is enabled (skip check if forceCreate is true)
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
  separator.textContent = '|';

  // Create label/state display
  const label = document.createElement('span');
  label.className = 'mapbox-gl-draw-label';
  label.textContent = '[A] Angle';

  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Angle [°]';
  input.className = 'mapbox-gl-draw-input';

  // Create clear button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'x';
  clearBtn.className = 'mapbox-gl-draw-clear';

  const updateDisplay = () => {
    if (state.currentAngle !== null && !isNaN(state.currentAngle)) {
      label.style.display = 'none';
      input.style.display = 'block';
      clearBtn.style.display = 'block';
    } else {
      label.style.display = 'inline-block';
      input.style.display = 'none';
      clearBtn.style.display = 'none';
    }
  };

  // Add focus/blur handlers
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
    // Prevent event from bubbling to map
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

  // Add keyboard shortcuts
  const keyHandler = (e) => {
    // Only respond when conditions are met
    if (!shouldActivateKeyHandler()) {
      return;
    }

    // 'A' key to toggle angle input
    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      e.stopPropagation();

      // Toggle: if angle is active, clear it; otherwise activate it
      if (state.currentAngle !== null || document.activeElement === input) {
        state.currentAngle = null;
        input.value = '';
        input.blur();
        updateDisplay();
      } else {
        input.style.display = 'block';
        label.style.display = 'none';
        input.focus();
      }
    }
  };
  document.addEventListener('keydown', keyHandler);

  distanceContainer.appendChild(separator);
  distanceContainer.appendChild(label);
  distanceContainer.appendChild(input);
  distanceContainer.appendChild(clearBtn);

  // Store references in state
  state.angleInput = input;
  state.angleKeyHandler = keyHandler;
  state.angleSeparator = separator;
  state.angleUpdateDisplay = updateDisplay;

  updateDisplay();

  return {
    separator,
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
  // Clear values
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

  const separator = document.createElement('span');
  separator.className = 'mapbox-gl-draw-input-separator';
  separator.textContent = '|';

  const label = document.createElement('span');
  label.className = 'mapbox-gl-draw-snapping-label';
  label.textContent = '[⇧] Snapping';

  const updateLabel = (shiftHeld) => {
    if (shiftHeld) {
      label.textContent = '[⇧] No Snap';
      label.classList.add('disabled');
    } else {
      label.textContent = '[⇧] Snapping';
      label.classList.remove('disabled');
    }
    if (ctx.snapping) {
      ctx.snapping.setDisabled(shiftHeld);
    }
  };

  const keydownHandler = (e) => {
    if (e.key === 'Shift') {
      updateLabel(true);
    }
  };

  const keyupHandler = (e) => {
    if (e.key === 'Shift') {
      updateLabel(false);
    }
  };

  document.addEventListener('keydown', keydownHandler);
  document.addEventListener('keyup', keyupHandler);

  distanceContainer.appendChild(separator);
  distanceContainer.appendChild(label);

  state.snappingIndicatorSeparator = separator;
  state.snappingIndicatorLabel = label;
  state.snappingKeydownHandler = keydownHandler;
  state.snappingKeyupHandler = keyupHandler;
  state.snappingCtx = ctx;

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
  if (state.snappingCtx && state.snappingCtx.snapping) {
    state.snappingCtx.snapping.setDisabled(false);
    state.snappingCtx = null;
  }
  if (state.distanceContainer && state.distanceContainer.parentNode) {
    state.distanceContainer.parentNode.removeChild(state.distanceContainer);
    state.distanceContainer = null;
  }
  state.distanceInput = null;
  state.angleInput = null;
  state.snappingIndicatorSeparator = null;
  state.snappingIndicatorLabel = null;
}
