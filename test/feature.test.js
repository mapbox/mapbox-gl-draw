import test from 'node:test';
import assert from 'node:assert/strict';

import {spy} from 'sinon';
import Feature from '../src/feature_types/feature.js';
import createFeature from './utils/create_feature.js';
import getPublicMemberKeys from './utils/get_public_member_keys.js';
import createMockCtx from './utils/create_mock_feature_context.js';

test('Feature contrusctor and API', () => {
  const featureGeoJson = createFeature('line');
  const ctx = createMockCtx();
  const feature = new Feature(ctx, featureGeoJson);

  // Instance members
  assert.equal(feature.ctx, ctx, 'feature.ctx');
  assert.equal(feature.coordinates, featureGeoJson.geometry.coordinates, 'feature.coordinates');
  assert.equal(feature.properties, featureGeoJson.properties, 'feature.properties');
  assert.equal(feature.id, featureGeoJson.id, 'feature.id');
  assert.equal(feature.type, featureGeoJson.geometry.type, 'feature.type');
  assert.equal(getPublicMemberKeys(feature).length, 5, 'no unexpected instance members');

  // Prototype members
  assert.equal(typeof Feature.prototype.changed, 'function', 'feature.changed');
  assert.equal(typeof Feature.prototype.incomingCoords, 'function', 'feature.incomingCoords');
  assert.equal(typeof Feature.prototype.setCoordinates, 'function', 'feature.setCoordinates');
  assert.equal(typeof Feature.prototype.getCoordinates, 'function', 'feature.getCoordinates');
  assert.equal(typeof Feature.prototype.toGeoJSON, 'function', 'feature.toGeoJSON');
  assert.equal(typeof Feature.prototype.internal, 'function', 'feature.internal');
  assert.equal(typeof Feature.prototype.setProperty, 'function', 'feature.setProperty');
  assert.equal(getPublicMemberKeys(Feature.prototype).length, 7, 'no unexpected prototype members');

  const simpleFeatureGeoJson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  };
  const featureWithDefaultsOnly = new Feature(ctx, simpleFeatureGeoJson);
  assert.deepEqual(featureWithDefaultsOnly.properties, {}, 'feature.properties defaults to {}');
  assert.ok(featureWithDefaultsOnly.id, 'feature.id is provided');
});

test('Feature#changed', () => {
  const ctx = createMockCtx();
  const featureGeoJson = createFeature('point');
  const feature = new Feature(ctx, featureGeoJson);

  ctx.store.featureChanged.resetHistory();
  feature.changed();
  assert.equal(ctx.store.featureChanged.callCount, 1, 'called function on store');
  assert.deepEqual(ctx.store.featureChanged.getCall(0).args, [featureGeoJson.id], 'with correct args');


});

test('Feature#incomingCoords', () => {
  const ctx = createMockCtx();
  const featureGeoJson = createFeature('point');
  featureGeoJson.geometry.coordinates = [9, 10];
  const feature = new Feature(ctx, featureGeoJson);
  const changedSpy = spy(feature, 'changed');

  feature.incomingCoords([1, 2]);
  assert.deepEqual(feature.coordinates, [1, 2]);
  assert.equal(changedSpy.callCount, 1);

});

test('Feature#setCoordinates, Feature#setCoordinates', () => {
  const ctx = createMockCtx();
  const featureGeoJson = createFeature('point');
  featureGeoJson.geometry.coordinates = [9, 10];
  const feature = new Feature(ctx, featureGeoJson);
  const changedSpy = spy(feature, 'changed');

  assert.deepEqual(feature.getCoordinates(), [9, 10]);

  feature.setCoordinates([1, 2]);
  assert.deepEqual(feature.coordinates, [1, 2]);
  assert.deepEqual(feature.getCoordinates(), [1, 2]);
  assert.equal(changedSpy.callCount, 1);

});

test('Feature#toGeoJSON', () => {
  const ctx = createMockCtx();
  const polygon = createFeature('polygon');
  const feature = new Feature(ctx, polygon);
  assert.deepEqual(feature.toGeoJSON(), {
    id: feature.id,
    type: 'Feature',
    properties: feature.properties,
    geometry: {
      coordinates: feature.coordinates,
      type: feature.type
    }
  });

});

test('Feature#internal - when userProperties is true', () => {
  const ctx = createMockCtx({userProperties: true});
  const polygon = createFeature('polygon');
  const feature = new Feature(ctx, polygon);
  assert.deepEqual(feature.internal('foo'), {
    type: 'Feature',
    properties: {
      user_a: 'b',
      user_c: 'd',
      id: feature.id,
      meta: 'feature',
      'meta:type': feature.type,
      active: 'false',
      mode: 'foo'
    },
    geometry: {
      coordinates: feature.coordinates,
      type: feature.type
    }
  });


});
test('Feature#internal - when userProperties is false', () => {
  const ctx = createMockCtx({userProperties: false});
  const polygon = createFeature('polygon');
  const feature = new Feature(ctx, polygon);
  assert.deepEqual(feature.internal('foo'), {
    type: 'Feature',
    properties: {
      id: feature.id,
      meta: 'feature',
      'meta:type': feature.type,
      active: 'false',
      mode: 'foo'
    },
    geometry: {
      coordinates: feature.coordinates,
      type: feature.type
    }
  });

});

test('Feature#setProperty', () => {
  const ctx = createMockCtx();
  const polygon = createFeature('polygon');
  const feature = new Feature(ctx, polygon);
  feature.setProperty('size', 200);
  assert.equal(feature.properties.size, 200);

});
