import * as Constants from '../constants';
import { MapMouseEvent, MapTouchEvent } from '../types/types';

type E = MapMouseEvent | MapTouchEvent;

export function isOfMetaType(type: string) { return function (e: E) {
    const featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === type;
  };
}

export function isShiftMousedown(e: MapMouseEvent) {
  if (!e.originalEvent) return false;
  if (!e.originalEvent.shiftKey) return false;
  return e.originalEvent.button === 0;
}

export function isActiveFeature(e: E) {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return (
    e.featureTarget.properties.active === Constants.activeStates.ACTIVE &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE
  );
}

export function isInactiveFeature(e: E) {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return (
    e.featureTarget.properties.active === Constants.activeStates.INACTIVE &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE
  );
}

export function noTarget(e: E) {
  return e.featureTarget === undefined;
}

export function isFeature(e: E) {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return e.featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function isVertex(e: E) {
  const featureTarget = e.featureTarget;
  if (!featureTarget) return false;
  if (!featureTarget.properties) return false;
  return featureTarget.properties.meta === Constants.meta.VERTEX;
}

export function isShiftDown(e: MapMouseEvent) {
  if (!e.originalEvent) return false;
  return e.originalEvent.shiftKey === true;
}

export function isEscapeKey(e: KeyboardEvent) {
  return e.key === 'Escape';
}

export function isEnterKey(e: KeyboardEvent) {
  return e.key === 'Enter';
}

export function isTrue() {
  return true;
}
