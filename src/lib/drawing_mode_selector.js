export const DRAWING_SUB_MODES = {
  FREE: 'free',
  RECTANGLE: 'rectangle',
  LINE: 'line',
};

const SUB_MODE_LABELS = {
  [DRAWING_SUB_MODES.FREE]: 'Free',
  [DRAWING_SUB_MODES.RECTANGLE]: 'Rect',
  [DRAWING_SUB_MODES.LINE]: 'Line',
};

const SUB_MODE_ORDER = [DRAWING_SUB_MODES.FREE, DRAWING_SUB_MODES.RECTANGLE, DRAWING_SUB_MODES.LINE];

export function createDrawingModeSelector(ctx, state) {
  if (!ctx.options.useAngleDistanceInput) {
    return null;
  }

  // Restore previous sub-mode from context, or default to FREE
  state.drawingSubMode = ctx.lastDrawingSubMode || DRAWING_SUB_MODES.FREE;

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

  const modeLabel = document.createElement('span');
  modeLabel.className = 'mapbox-gl-draw-mode-selector-label';
  modeLabel.textContent = SUB_MODE_LABELS[state.drawingSubMode];
  container.appendChild(modeLabel);

  ctx.map.getContainer().appendChild(container);

  const updateLabel = () => {
    modeLabel.textContent = SUB_MODE_LABELS[state.drawingSubMode];
  };

  const keyHandler = (e) => {
    if (e.key === 'm' || e.key === 'M') {
      if (state.vertices && state.vertices.length > 0) return;
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      e.preventDefault();
      e.stopPropagation();
      const currentIndex = SUB_MODE_ORDER.indexOf(state.drawingSubMode);
      state.drawingSubMode = SUB_MODE_ORDER[(currentIndex + 1) % SUB_MODE_ORDER.length];
      ctx.lastDrawingSubMode = state.drawingSubMode;
      updateLabel();
    }
  };
  document.addEventListener('keydown', keyHandler);

  state.modeSelectorContainer = container;
  state.modeSelectorKeyHandler = keyHandler;
  state.modeSelectorLabel = modeLabel;

  return { container, modeLabel, keyHandler };
}

export function hideDrawingModeSelector(state) {
  if (state.modeSelectorContainer) {
    state.modeSelectorContainer.style.display = 'none';
  }
}

export function showDrawingModeSelector(state) {
  if (state.modeSelectorContainer) {
    state.modeSelectorContainer.style.display = 'flex';
  }
}

export function removeDrawingModeSelector(state) {
  if (state.modeSelectorKeyHandler) {
    document.removeEventListener('keydown', state.modeSelectorKeyHandler);
    state.modeSelectorKeyHandler = null;
  }
  if (state.modeSelectorContainer && state.modeSelectorContainer.parentNode) {
    state.modeSelectorContainer.parentNode.removeChild(state.modeSelectorContainer);
    state.modeSelectorContainer = null;
  }
  state.modeSelectorLabel = null;
}
