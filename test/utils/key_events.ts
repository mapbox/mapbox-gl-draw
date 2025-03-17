import createSyntheticEvent from 'synthetic-dom-events';
import * as Constants from '../../src/constants';

const classList = [Constants.classes.CANVAS] as any;

classList.contains = function (cls: string) {
  return this.includes(cls);
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
