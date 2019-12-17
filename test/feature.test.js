import test from 'tape';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import Feature from '../src/feature_types/feature';
import createFeature from './utils/create_feature';
import getPublicMemberKeys from './utils/get_public_member_keys';
import createMockCtx from './utils/create_mock_feature_context';

test('Feature contrusctor and API', (t) => {
  const featureGeoJson = createFeature('line');
  const ctx = createMockCtx();
  const feature = new Feature(ctx, featureGeoJson);

  // Instance members
  t.equal(feature.ctx, ctx, 'feature.ctx');
  t.equal(feature.coordinates, featureGeoJson.geometry.coordinates, 'feature.coordinates');
  t.equal(feature.properties, featureGeoJson.properties, 'feature.properties');
  t.equal(feature.id, featureGeoJson.id, 'feature.id');
  t.equal(feature.type, featureGeoJson.geometry.type, 'feature.type');
  t.equal(getPublicMemberKeys(feature).length, 5, 'no unexpected instance members');

  // Prototype members
  t.equal(typeof Feature.prototype.changed, 'function', 'feature.changed');
  t.equal(typeof Feature.prototype.incomingCoords, 'function', 'feature.incomingCoords');
  t.equal(typeof Feature.prototype.setCoordinates, 'function', 'feature.setCoordinates');
  t.equal(typeof Feature.prototype.getCoordinates, 'function', 'feature.getCoordinates');
  t.equal(typeof Feature.prototype.toGeoJSON, 'function', 'feature.toGeoJSON');
  t.equal(typeof Feature.prototype.internal, 'function', 'feature.internal');
  t.equal(typeof Feature.prototype.setProperty, 'function', 'feature.setProperty');
  t.equal(getPublicMemberKeys(Feature.prototype).length, 7, 'no unexpected prototype members');

  const simpleFeatureGeoJson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  };
  const featureWithDefaultsOnly = new Feature(ctx, simpleFeatureGeoJson);
  t.deepEqual(featureWithDefaultsOnly.properties, {}, 'feature.properties defaults to {}');
  t.ok(featureWithDefaultsOnly.id, 'feature.id is provided');

  t.end();
});

test('Feature#changed', (t) => {
  const ctx = createMockCtx();
  const featureGeoJson = createFeature('point');
  const feature = new Feature(ctx, featureGeoJson);

  ctx.store.featureChanged.resetHistory();
  feature.changed();
  t.equal(ctx.store.featureChanged.callCount, 1, 'called function on store');
  t.deepEqual(ctx.store.featureChanged.getCall(0).args, [featureGeoJson.id], 'with correct args');

  t.end();
});

test('Feature#incomingCoords', (t) => {
  const ctx = createMockCtx();
  const featureGeoJson = createFeature('point');
  featureGeoJson.geometry.coordinates = [9, 10];
  const feature = new Feature(ctx, featureGeoJson);
  const changedSpy = spy(feature, 'changed');

  feature.incomingCoords([1, 2]);
  t.deepEqual(feature.coordinates, [1, 2]);
  t.equal(changedSpy.callCount, 1);
  t.end();
});

test('Feature#setCoordinates, Feature#setCoordinates', (t) => {
  const ctx = createMockCtx();
  const featureGeoJson = createFeature('point');
  featureGeoJson.geometry.coordinates = [9, 10];
  const feature = new Feature(ctx, featureGeoJson);
  const changedSpy = spy(feature, 'changed');

  t.deepEqual(feature.getCoordinates(), [9, 10]);

  feature.setCoordinates([1, 2]);
  t.deepEqual(feature.coordinates, [1, 2]);
  t.deepEqual(feature.getCoordinates(), [1, 2]);
  t.equal(changedSpy.callCount, 1);
  t.end();
});

test('Feature#toGeoJSON', (t) => {
  const ctx = createMockCtx();
  const polygon = createFeature('polygon');
  const feature = new Feature(ctx, polygon);
  t.deepEqual(feature.toGeoJSON(), {
    id: feature.id,
    type: 'Feature',
    properties: feature.properties,
    geometry: {
      coordinates: feature.coordinates,
      type: feature.type
    }
  });
  t.end();
});

test('Feature#internal - when userProperties is true', (t) => {
  const ctx = createMockCtx({userProperties: true});
  const polygon = createFeature('polygon');
  const feature = new Feature(ctx, polygon);
  t.deepEqual(feature.internal('foo'), {
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
  t.end();

});
test('Feature#internal - when userProperties is false', (t) => {
  const ctx = createMockCtx({userProperties: false});
  const polygon = createFeature('polygon');
  const feature = new Feature(ctx, polygon);
  t.deepEqual(feature.internal('foo'), {
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
  t.end();
});

test('Feature#setProperty', (t) => {
  const ctx = createMockCtx();
  const polygon = createFeature('polygon');
  const feature = new Feature(ctx, polygon);
  feature.setProperty('size', 200);
  t.equal(feature.properties.size, 200);
  t.end();
});
