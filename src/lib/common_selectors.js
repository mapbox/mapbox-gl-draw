const Constants = require('../constants');

module.exports = {
  isOfMetaType(type) {
    return function(e) {
      const featureTarget = e.featureTarget;
      if (!featureTarget) return false;
      if (!featureTarget.properties) return false;
      return featureTarget.properties.meta === type;
    };
  },
  isShiftMousedown(e) {
    if (!e.originalEvent) return false;
    if (!e.originalEvent.shiftKey) return false;
    return e.originalEvent.button === 0;
  },
  isActiveFeature(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.active === Constants.activeStates.ACTIVE &&
      e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  isInactiveFeature(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.active === Constants.activeStates.INACTIVE &&
      e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  noTarget(e) {
    return e.featureTarget === undefined;
  },
  isFeature(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  isVertex(e) {
    const featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === Constants.meta.VERTEX;
  },
  isShiftDown(e) {
    if (!e.originalEvent) return false;
    return e.originalEvent.shiftKey === true;
  },
  isEscapeKey(e) {
    return e.keyCode === 27;
  },
  isEnterKey(e) {
    return e.keyCode === 13;
  },
  true() {
    return true;
  }
};
