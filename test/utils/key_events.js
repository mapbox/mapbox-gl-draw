import createSyntheticEvent from 'synthetic-dom-events';
import * as Constants from '../../src/constants.js';

const classList = [Constants.classes.CANVAS];
classList.contains = function(cls) {
  return classList.indexOf(cls) >= 0;
};

export const enterEvent = createSyntheticEvent('keyup', {
  srcElement: { classList },
  key: 'Enter'
});

export const startPointEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  key: '1'
});

export const startLineStringEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  key: '2'
});

export const startPolygonEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  key: '3'
});

export const escapeEvent = createSyntheticEvent('keyup', {
  srcElement: { classList },
  key: 'Escape'
});

export const backspaceEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  key: 'Backspace'
});
