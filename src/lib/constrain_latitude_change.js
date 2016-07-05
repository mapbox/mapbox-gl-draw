const getEdgeLatitudes = require('./get_edge_latitudes');
const Constants = require('../constants');

const {
  LAT_MIN,
  LAT_MAX,
  LAT_RENDERED_MIN,
  LAT_RENDERED_MAX
} = Constants;

// Ensure that we do not drag north-south far enough for
// - any part of any feature to exceed the poles
// - any feature to be completely lost in the space between the projection's
//   edge and the poles, such that it couldn't be re-selected and moved back
module.exports = function(geojsonFeatures, delta) {
  // "inner edge" = a feature's latitude closest to the equator
  let northInnerEdge = LAT_MIN;
  let southInnerEdge = LAT_MAX;
  // "outer edge" = a feature's latitude furthest from the equator
  let northOuterEdge = LAT_MIN;
  let southOuterEdge = LAT_MAX;

  geojsonFeatures.forEach(feature => {
    const edges = getEdgeLatitudes(feature);
    // If the southern tip of this feature is further north than
    // the current north inner edge, it replaces the current value
    if (edges.south > northInnerEdge) {
      northInnerEdge = edges.south;
    }
    // If the northern tip of this feature is further south than
    // the current south inner edge, it replaces the current value
    if (edges.north < southInnerEdge) {
      southInnerEdge = edges.north
    }
    // If the northern tip of this feature is further north then
    // the current north outer edge, it replaces the current value
    if (edges.north > northOuterEdge) {
      northOuterEdge = edges.north;
    }
    // If the southern tip of this feature is further south then
    // the current south outer edge, it replaces the current value
    if (edges.south < southOuterEdge) {
      southOuterEdge = edges.south;
    }
  });


  // These changes are not mutually exclusive: we might hit the inner
  // edge but also have hit the outer edge and therefore need
  // another readjustment
  let constrainedDelta = delta;
  if (northInnerEdge + constrainedDelta > LAT_RENDERED_MAX) {
    constrainedDelta = LAT_RENDERED_MAX - northInnerEdge;
  }
  if (northOuterEdge + constrainedDelta > LAT_MAX) {
    constrainedDelta = LAT_MAX - northOuterEdge;
  }
  if (southInnerEdge + constrainedDelta < LAT_RENDERED_MIN) {
    constrainedDelta = LAT_RENDERED_MIN - southInnerEdge;
  }
  if (southOuterEdge + constrainedDelta < LAT_MIN) {
    constrainedDelta = LAT_MIN - southOuterEdge;
  }

  return constrainedDelta;
};
