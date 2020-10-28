import sortFeatures from './sort_features';
import mapEventToBoundingBox from './map_event_to_bounding_box';
import * as Constants from '../constants';
import StringSet from './string_set';

const META_TYPES = [
  Constants.meta.FEATURE,
  Constants.meta.MIDPOINT,
  Constants.meta.VERTEX
];

// Requires either event or bbox
export default {
  click: featuresAtClick,
  touch: featuresAtTouch
};

function featuresAtClick(event, bbox, ctx) {
  return featuresAt(event, bbox, ctx, ctx.options.clickBuffer);
}

function featuresAtTouch(event, bbox, ctx) {
  return featuresAt(event, bbox, ctx, ctx.options.touchBuffer);
}

function featuresAt(event, bbox, ctx, buffer) {
  if (ctx.map === null) return [];

  const box = (event) ? mapEventToBoundingBox(event, buffer) : bbox;

  const queryParams = {};
  if (ctx.options.styles) queryParams.layers = ctx.options.styles.map(s => s.id);

  const features = ctx.map.queryRenderedFeatures(box, queryParams)
    .filter(feature => META_TYPES.indexOf(feature.properties.meta) !== -1);

  const featureIds = new StringSet();
  const uniqueFeatures = [];
  features.forEach((feature) => {
    const featureId = feature.properties.id;
    if (featureIds.has(featureId)) return;
    featureIds.add(featureId);
    uniqueFeatures.push(feature);
  });

  return sortFeatures(uniqueFeatures);
}
