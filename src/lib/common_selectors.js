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
  return e.keyCode === 27;
}

export function isEnterKey(e) {
  return e.keyCode === 13;
}

export function isTrue() {
  return true;
}
