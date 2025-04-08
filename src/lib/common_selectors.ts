import * as Constants from '../constants';
import { MapMouseEvent, MapTouchEvent } from '../types/types';

type E = MapMouseEvent | MapTouchEvent;

export const isOfMetaType = (type: string) => {
  return (e: E) => {
    const featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === type;
  };
};

export const isShiftMousedown = (e: MapMouseEvent) => {
  if (!e.originalEvent) return false;
  if (!e.originalEvent.shiftKey) return false;
  return e.originalEvent.button === 0;
};

export const isActiveFeature = (e: E) => {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return (
    e.featureTarget.properties.active === Constants.activeStates.ACTIVE &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE
  );
};

export const isInactiveFeature = (e: E) => {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return (
    e.featureTarget.properties.active === Constants.activeStates.INACTIVE &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE
  );
}

export const noTarget = (e: E) => {
  return e.featureTarget === undefined;
};

export const isFeature = (e: E) => {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return e.featureTarget.properties.meta === Constants.meta.FEATURE;
};

export const isVertex = (e: E) => {
  const featureTarget = e.featureTarget;
  if (!featureTarget) return false;
  if (!featureTarget.properties) return false;
  return featureTarget.properties.meta === Constants.meta.VERTEX;
};

export const isShiftDown = (e: MapMouseEvent) => {
  if (!e.originalEvent) return false;
  return e.originalEvent.shiftKey === true;
};

export const isEscapeKey = (e: KeyboardEvent) => e.key === 'Escape';
export const isEnterKey = (e: KeyboardEvent) => e.key === 'Enter';
export const isTrue = () => true;
