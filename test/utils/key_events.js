import createSyntheticEvent from 'synthetic-dom-events';

export const enterEvent = createSyntheticEvent('keyup', {
  srcElement: { classList: ['mapboxgl-canvas']},
  keyCode: 13
});

export const startPointEvent = createSyntheticEvent('keydown', {
  srcElement: { classList: ['mapboxgl-canvas']},
  keyCode: 49
});

export const startLineStringEvent = createSyntheticEvent('keydown', {
  srcElement: { classList: ['mapboxgl-canvas']},
  keyCode: 50
});

export const startPolygonEvent = createSyntheticEvent('keydown', {
  srcElement: { classList: ['mapboxgl-canvas']},
  keyCode: 51
});

export const escapeEvent = createSyntheticEvent('keyup', {
  srcElement: { classList: ['mapboxgl-canvas']},
  keyCode: 27
});

export const backspaceEvent = createSyntheticEvent('keydown', {
  srcElement: { classList: ['mapboxgl-canvas']},
  keyCode: 8
});
