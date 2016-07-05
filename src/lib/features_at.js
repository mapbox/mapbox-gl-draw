var sortFeatures = require('./sort_features');
var mapEventToBoundingBox = require('./map_event_to_bounding_box');
var Constants = require('../constants');

var META_TYPES = [
  Constants.meta.FEATURE,
  Constants.meta.MIDPOINT,
  Constants.meta.VERTEX
];

// Requires either event or bbox
module.exports = function(event, bbox, ctx) {
  if (ctx.map === null) return [];

  var box = (event)
    ? mapEventToBoundingBox(event, ctx.options.clickBuffer)
    : bbox;

  var queryParams = {};
  if (ctx.options.styles) queryParams.layers = ctx.options.styles.map(s => s.id);

  var features = ctx.map.queryRenderedFeatures(box, queryParams)
    .filter(function(feature) {
      return META_TYPES.indexOf(feature.properties.meta) !== -1;
    });

  return sortFeatures(features);
};
