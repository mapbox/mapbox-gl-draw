var featuresAt = require('./features_at');

module.exports = function getFeatureAtAndSetCursors(event, ctx) {
  var features = featuresAt(event, null, ctx);
  var classes = { mouse: 'none' };

  if (features[0]) {
    classes.mouse = features[0].properties.active === 'true' ? 'move' : 'pointer';
    classes.feature = features[0].properties.meta;
  }

  if (ctx.events.currentModeName().includes('draw')) {
    classes.mouse = 'add';
  }

  ctx.ui.setClass(classes);

  return features[0];
};
