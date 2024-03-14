import createSyntheticEvent from 'synthetic-dom-events';

const classList = ['mapboxgl-canvas'];
classList.contains = function(cls) {
  return classList.indexOf(cls) >= 0;
};

export const enterEvent = createSyntheticEvent('keyup', {
  srcElement: { classList },
  keyCode: 13
});

export const startPointEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  keyCode: 49
});

export const startLineStringEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  keyCode: 50
});

export const startPolygonEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  keyCode: 51
});

export const escapeEvent = createSyntheticEvent('keyup', {
  srcElement: { classList },
  keyCode: 27
});

export const backspaceEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  keyCode: 8
});
