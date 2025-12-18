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

  // Calculate position from normalized coordinates
  const mapContainer = ctx.map.getContainer();
  const mapWidth = mapContainer.offsetWidth;
  const mapHeight = mapContainer.offsetHeight;
  const [normX, normY] = ctx.options.angleDistanceInputPosition;

  // Convert normalized position to pixel coordinates
  const pixelX = mapWidth * normX;
  const pixelY = mapHeight * normY;

  // Set critical inline styles (CSS classes can override for customization)
  container.style.cssText = `
    position: fixed;
    top: ${pixelY}px;
    left: ${pixelX}px;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(200, 200, 200, 0.8);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 6px 10px;
    display: ${initiallyHidden ? 'none' : 'flex'};
    align-items: center;
    gap: 6px;
    font-size: 11px;
    pointer-events: auto;
    transition: opacity 0.2s ease-in-out;
  `;

  // Create label/state display
  const label = document.createElement('span');
  label.className = 'mapbox-gl-draw-distance-label';
  label.textContent = 'D for distance';
  label.style.cssText = `
    color: #666;
    font-size: 9px;
    white-space: nowrap;
    width: 80px;
    text-align: center;
    display: inline-block;
  `;

  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'distance (m)';
  input.className = 'mapbox-gl-draw-distance-input';
  input.style.cssText = `
    border: 1px solid rgba(200, 200, 200, 0.8);
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 9px;
    width: 80px;
    display: none;
    outline: none;
    background: transparent;
    transition: background-color 0.2s;
  `;

  // Create clear button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '×';
  clearBtn.className = 'mapbox-gl-draw-distance-clear';
  clearBtn.style.cssText = `
    border: none;
    background: none;
    color: #666;
    font-size: 16px;
    cursor: pointer;
    padding: 0 3px;
    line-height: 1;
    display: none;
  `;

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
    if (e.key === 'Enter' || e.key === 'Escape' || (e.key === 'Backspace' && e.target.value === '')) {
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
    } else if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault();
      if (onBackspace) onBackspace();
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

    // 'D' key to toggle distance input
    if (e.key === 'd' || e.key === 'D') {
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
    // Backspace to remove last vertex (when not focused on input)
    else if (e.key === 'Backspace' && document.activeElement !== input) {
      e.preventDefault();
      e.stopPropagation();
      if (onBackspace) onBackspace();
    }
  };
  document.addEventListener('keydown', keyHandler);

  container.appendChild(label);
  container.appendChild(input);
  container.appendChild(clearBtn);
  document.body.appendChild(container);

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
  separator.style.cssText = `
    color: #ccc;
    font-size: 11px;
    padding: 0 3px;
  `;

  // Create label/state display
  const label = document.createElement('span');
  label.className = 'mapbox-gl-draw-angle-label';
  label.textContent = 'A for angle';
  label.style.cssText = `
    color: #666;
    font-size: 9px;
    white-space: nowrap;
    width: 80px;
    text-align: center;
    display: inline-block;
  `;

  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'angle (°)';
  input.className = 'mapbox-gl-draw-angle-input';
  input.style.cssText = `
    border: 1px solid rgba(200, 200, 200, 0.8);
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 9px;
    width: 80px;
    display: none;
    outline: none;
    background: transparent;
    transition: background-color 0.2s;
  `;

  // Create clear button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '×';
  clearBtn.className = 'mapbox-gl-draw-angle-clear';
  clearBtn.style.cssText = `
    border: none;
    background: none;
    color: #666;
    font-size: 16px;
    cursor: pointer;
    padding: 0 3px;
    line-height: 1;
    display: none;
  `;

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
    if (e.key === 'Enter' || e.key === 'Escape' || (e.key === 'Backspace' && e.target.value === '')) {
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
    } else if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault();
      if (onBackspace) onBackspace();
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
  if (state.distanceContainer && state.distanceContainer.parentNode) {
    state.distanceContainer.parentNode.removeChild(state.distanceContainer);
    state.distanceContainer = null;
  }
  state.distanceInput = null;
  state.angleInput = null;
}
