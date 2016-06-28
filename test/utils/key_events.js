import createSyntheticEvent from 'synthetic-dom-events';

export const enterEvent = createSyntheticEvent('keyup', {
  keyCode: 13
});

export const startPointEvent = createSyntheticEvent('keydown', {
  keyCode: 49
});

export const startLineStringEvent = createSyntheticEvent('keydown', {
  keyCode: 50
});

export const startPolygonEvent = createSyntheticEvent('keydown', {
  keyCode: 51
});

export const escapeEvent = createSyntheticEvent('keyup', {
  keyCode: 27
});
