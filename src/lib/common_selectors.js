module.exports = {
  isOfMetaType: function(type) {
    return function(e) {
      var featureTarget = e.featureTarget;
      if (featureTarget) {
        return featureTarget.properties.meta === type;
      }
      else {
        return false;
      }
    };
  },
  isActiveFeature: function(e) {
    return e.featureTarget !== undefined &&
      e.featureTarget.properties.active === 'true' &&
      e.featureTarget.properties.meta === 'feature';
  },
  isInactiveFeature: function(e) {
    return e.featureTarget !== undefined &&
      e.featureTarget.properties.active === 'false' &&
      e.featureTarget.properties.meta === 'feature';
  },
  noFeature: function(e) {
    return e.featureTarget === undefined;
  },
  isFeature: function(e) {
    return e.featureTarget !== undefined && e.featureTarget.properties.meta === 'feature';
  },
  isShiftDown: function(e) {
    return e.originalEvent.shiftKey === true;
  },
  isEscapeKey: function(e) {
    return e.keyCode === 27;
  },
  isEnterKey: function(e) {
    return e.keyCode === 13;
  }
};
