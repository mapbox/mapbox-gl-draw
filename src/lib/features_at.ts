import { sortFeatures } from './sort_features';
import { mapEventToBoundingBox } from './map_event_to_bounding_box';
import * as Constants from '../constants';
import StringSet from './string_set';

import type { BBox } from 'geojson';
import type { CTX, MapMouseEvent, MapTouchEvent } from '../types/types';

type E = MapMouseEvent | MapTouchEvent;

const META_TYPES = [
  Constants.meta.FEATURE,
  Constants.meta.MIDPOINT,
  Constants.meta.VERTEX
];

const featuresAt = (event: E, bbox: BBox, ctx: CTX, buffer: number) => {
  if (ctx.map === null) return [];

  const box = event ? mapEventToBoundingBox(event, buffer) : bbox;

  const queryParams: {
    layers?: Array<string>;
  } = {};

  if (ctx.options.styles)
    queryParams.layers = ctx.options.styles
      .map(s => s.id)
      .filter(id => ctx.map.getLayer(id) != null);

  const features = ctx.map
    .queryRenderedFeatures(box, queryParams)
    .filter(feature => META_TYPES.indexOf(feature?.properties?.meta) !== -1);

  const featureIds = new StringSet();
  const uniqueFeatures = [];
  features.forEach(feature => {
    const featureId = feature.properties?.id;
    if (featureIds.has(featureId)) return;
    featureIds.add(featureId);
    uniqueFeatures.push(feature);
  });

  return sortFeatures(uniqueFeatures);
};

function featuresAtClick(event: E, bbox: BBox, ctx: CTX) {
  return featuresAt(event, bbox, ctx, ctx.options.clickBuffer);
}

function featuresAtTouch(event: E, bbox: BBox, ctx: CTX) {
  return featuresAt(event, bbox, ctx, ctx.options.touchBuffer);
}

// Requires either event or bbox
export const click = featuresAtClick;
export const touch = featuresAtTouch;
