/**
 * Drawing Sub-Mode Selector UI
 *
 * Shows a mode selector (Free / Rectangle) before drawing starts.
 * Uses the same position and similar styling as the angle/distance input bar.
 * Hidden once drawing begins (first vertex placed).
 */

export const DRAWING_SUB_MODES = {
  FREE: 'free',
  RECTANGLE: 'rectangle',
};

const SUB_MODE_LABELS = {
  [DRAWING_SUB_MODES.FREE]: 'Free',
  [DRAWING_SUB_MODES.RECTANGLE]: 'Rect',
};

const SUB_MODE_ORDER = [DRAWING_SUB_MODES.FREE, DRAWING_SUB_MODES.RECTANGLE];

/**
 * Create the drawing sub-mode selector UI
 * @param {Object} ctx - The draw context
 * @param {Object} state - The mode state
 * @returns {Object|null} The created UI elements or null if disabled
 */
export function createDrawingModeSelector(ctx, state) {
  if (!ctx.options.useAngleDistanceInput) {
    return null;
  }

  state.drawingSubMode = DRAWING_SUB_MODES.FREE;

  const container = document.createElement('div');
  container.className = 'mapbox-gl-draw-mode-selector-container';

  const [leftPos, topPos] = ctx.options.angleDistanceInputPosition;
  container.style.cssText = `
    position: absolute;
    top: ${topPos};
    left: ${leftPos};
  `;

  const mKeyBadge = document.createElement('span');
  mKeyBadge.className = 'mapbox-gl-draw-mode-selector-key';
  mKeyBadge.textContent = 'M';
  container.appendChild(mKeyBadge);

  const buttonsWrapper = document.createElement('div');
  buttonsWrapper.className = 'mapbox-gl-draw-mode-selector-buttons';

  const buttons = {};
  SUB_MODE_ORDER.forEach((mode) => {
    const btn = document.createElement('button');
    btn.className = 'mapbox-gl-draw-mode-selector-btn';
    btn.textContent = SUB_MODE_LABELS[mode];
    btn.dataset.mode = mode;
    if (mode === state.drawingSubMode) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveMode(state, mode, buttons);
    });
    buttonsWrapper.appendChild(btn);
    buttons[mode] = btn;
  });

  container.appendChild(buttonsWrapper);
  ctx.map.getContainer().appendChild(container);

  const keyHandler = (e) => {
    if (e.key === 'm' || e.key === 'M') {
      if (state.vertices && state.vertices.length > 0) return;
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      e.preventDefault();
      e.stopPropagation();
      cycleSubMode(state, buttons);
    }
  };
  document.addEventListener('keydown', keyHandler);

  state.modeSelectorContainer = container;
  state.modeSelectorKeyHandler = keyHandler;
  state.modeSelectorButtons = buttons;

  return { container, buttons, keyHandler };
}

function setActiveMode(state, mode, buttons) {
  state.drawingSubMode = mode;
  Object.keys(buttons).forEach((key) => {
    buttons[key].classList.toggle('active', key === mode);
  });
}

function cycleSubMode(state, buttons) {
  const currentIndex = SUB_MODE_ORDER.indexOf(state.drawingSubMode);
  const nextIndex = (currentIndex + 1) % SUB_MODE_ORDER.length;
  setActiveMode(state, SUB_MODE_ORDER[nextIndex], buttons);
}

/**
 * Hide the mode selector (called when drawing starts)
 */
export function hideDrawingModeSelector(state) {
  if (state.modeSelectorContainer) {
    state.modeSelectorContainer.style.display = 'none';
  }
}

/**
 * Show the mode selector (if no vertices placed)
 */
export function showDrawingModeSelector(state) {
  if (state.modeSelectorContainer) {
    state.modeSelectorContainer.style.display = 'flex';
  }
}

/**
 * Remove the mode selector UI and clean up event listeners
 */
export function removeDrawingModeSelector(state) {
  if (state.modeSelectorKeyHandler) {
    document.removeEventListener('keydown', state.modeSelectorKeyHandler);
    state.modeSelectorKeyHandler = null;
  }
  if (state.modeSelectorContainer && state.modeSelectorContainer.parentNode) {
    state.modeSelectorContainer.parentNode.removeChild(state.modeSelectorContainer);
    state.modeSelectorContainer = null;
  }
  state.modeSelectorButtons = null;
}
