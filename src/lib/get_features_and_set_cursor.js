var featuresAt = require('./features_at');
var Constants = require('../constants');

module.exports = function getFeatureAtAndSetCursors(event, ctx) {
  var features = featuresAt(event, null, ctx);
  var classes = { mouse: Constants.cursors.NONE };

  if (features[0]) {
    classes.mouse = (features[0].properties.active === Constants.activeStates.ACTIVE)
      ? Constants.cursors.MOVE
      : Constants.cursors.POINTER;
    classes.feature = features[0].properties.meta;
  }

  if (ctx.events.currentModeName().indexOf('draw') !== -1) {
    classes.mouse = Constants.cursors.ADD;
  }

  ctx.ui.queueMapClasses(classes);
  ctx.ui.updateMapClasses();

  return features[0];
};
