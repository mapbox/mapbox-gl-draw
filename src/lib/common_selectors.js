const Constants = require('../constants');

module.exports = {
  isOfMetaType: function(type) {
    return function(e) {
      const featureTarget = e.featureTarget;
      if (!featureTarget) return false;
      if (!featureTarget.properties) return false;
      return featureTarget.properties.meta === type;
    };
  },
  isShiftMousedown: function(e) {
    if (!e.srcEvent) return false;
    if (!e.srcEvent.shiftKey) return false;
    return e.srcEvent.button === 0;
  },
  isActiveFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.active === Constants.activeStates.ACTIVE &&
      e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  isInactiveFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.active === Constants.activeStates.INACTIVE &&
      e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  noTarget: function(e) {
    return e.featureTarget === undefined;
  },
  isFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  isVertex: function(e) {
    const featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === Constants.meta.VERTEX;
  },
  isShiftDown: function(e) {
    if (!e.srcEvent) return false;
    return e.srcEvent.shiftKey === true;
  },
  isEscapeKey: function(e) {
    return e.keyCode === 27;
  },
  isEnterKey: function(e) {
    return e.keyCode === 13;
  },
  true: function() {
    return true;
  }
};
