import * as Constants from '../constants.js';

export function isOfMetaType(type) {
  return function(e) {
    const featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === type;
  };
}

export function isShiftMousedown(e) {
  if (!e.originalEvent) return false;
  if (!e.originalEvent.shiftKey) return false;
  return e.originalEvent.button === 0;
}

export function isActiveFeature(e) {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return e.featureTarget.properties.active === Constants.activeStates.ACTIVE &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function isInactiveFeature(e) {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return e.featureTarget.properties.active === Constants.activeStates.INACTIVE &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function noTarget(e) {
  return e.featureTarget === undefined;
}

export function isFeature(e) {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return e.featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function isVertex(e) {
  const featureTarget = e.featureTarget;
  if (!featureTarget) return false;
  if (!featureTarget.properties) return false;
  return featureTarget.properties.meta === Constants.meta.VERTEX;
}

export function isShiftDown(e) {
  if (!e.originalEvent) return false;
  return e.originalEvent.shiftKey === true;
}

export function isEscapeKey(e) {
  return e.key === 'Escape' || e.keyCode === 27;
}

export function isEnterKey(e) {
  return e.key === 'Enter' || e.keyCode === 13;
}

export function isBackspaceKey(e) {
  return e.key === 'Backspace' || e.keyCode === 8;
}

export function isDeleteKey(e) {
  return e.key === 'Delete' || e.keyCode === 46;
}

export function isDigit1Key(e) {
  return e.key === '1' || e.keyCode === 49;
}

export function isDigit2Key(e) {
  return e.key === '2' || e.keyCode === 50;
}

export function isDigit3Key(e) {
  return e.key === '3' || e.keyCode === 51;
}

export function isDigitKey(e) {
  const key = e.key || String.fromCharCode(e.keyCode);
  const isDigitKey = key >= '0' && key <= '9';
  return isDigitKey;
}

export function isTrue() {
  return true;
}
