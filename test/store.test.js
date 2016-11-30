import test from 'tape';
import Store from '../src/store';
import createFeature from './utils/create_feature';
import getPublicMemberKeys from './utils/get_public_member_keys';
import createMap from './utils/create_map';

function createStore() {
  const map = createMap();
  const ctx = { map };
  return new Store(ctx);
}

test('Store has correct properties', t => {
  t.ok(Store, 'store exists');
  t.ok(typeof Store === 'function', 'store is a function');
  t.end();
});

test('Store constructor and public API', t => {
  const map = createMap();
  const ctx = { map };
  const store = new Store(ctx);

  // instance members
  t.deepEqual(store.sources, {
    hot: [],
    cold: []
  }, 'exposes store.sources');
  t.equal(store.ctx, ctx, 'exposes store.ctx');
  t.equal(store.isDirty, false, 'exposes store.isDirty');
  t.equal(typeof store.render, 'function', 'exposes store.render');

  t.equal(getPublicMemberKeys(store).length, 4, 'no unexpected instance members');

  // prototype members
  t.equal(typeof Store.prototype.setDirty, 'function', 'exposes store.setDirty');
  t.equal(typeof Store.prototype.createRenderBatch, 'function', 'exposes store.createRenderBatch');
  t.equal(typeof Store.prototype.featureChanged, 'function', 'exposes store.featureChanged');
  t.equal(typeof Store.prototype.getChangedIds, 'function', 'exposes store.getChangedIds');
  t.equal(typeof Store.prototype.clearChangedIds, 'function', 'exposes store.clearChangedIds');
  t.equal(typeof Store.prototype.getAllIds, 'function', 'exposes store.getAllIds');
  t.equal(typeof Store.prototype.add, 'function', 'exposes store.add');
  t.equal(typeof Store.prototype.get, 'function', 'exposes store.get');
  t.equal(typeof Store.prototype.getAll, 'function', 'exposes store.getAll');
  t.equal(typeof Store.prototype.select, 'function', 'exposes store.select');
  t.equal(typeof Store.prototype.deselect, 'function', 'exposes store.deselect');
  t.equal(typeof Store.prototype.clearSelected, 'function', 'exposes store.clearSelected');
  t.equal(typeof Store.prototype.getSelectedIds, 'function', 'exposes store.getSelectedIds');
  t.equal(typeof Store.prototype.getSelected, 'function', 'exposes store.getSelected');
  t.equal(typeof Store.prototype.isSelected, 'function', 'exposes store.isSelected');
  t.equal(typeof Store.prototype.delete, 'function', 'exposes store.delete');
  t.equal(typeof Store.prototype.setSelected, 'function', 'exposes store.setSelected');
  t.equal(typeof Store.prototype.setFeatureProperty, 'function', 'exposes store.setFeatureProperty');

  t.equal(getPublicMemberKeys(Store.prototype).length, 18, 'no untested prototype members');

  t.end();
});

test('Store#setDirty', t => {
  const store = createStore();
  t.equal(store.isDirty, false);
  store.setDirty();
  t.equal(store.isDirty, true);
  t.end();
});

test('Store#createRenderBatch', t => {
  const store = createStore();
  let numRenders = 0;
  store.render = function() {
    numRenders++;
  };
  store.render();
  t.equal(numRenders, 1, 'render incrementes number of renders');
  let renderBatch = store.createRenderBatch();
  store.render();
  store.render();
  store.render();
  t.equal(numRenders, 1, 'when batching render doesn\'t get incremented');
  renderBatch();
  t.equal(numRenders, 2, 'when releasing batch, render only happens once');

  renderBatch = store.createRenderBatch();
  renderBatch();
  t.equal(numRenders, 2, 'when releasing batch, render doesn\'t happen if render wasn\'t called');

  t.end();
});

test('Store#featureChanged, Store#getChangedIds, Store#clearChangedIds', t => {
  const store = createStore();
  t.deepEqual(store.getChangedIds(), []);
  store.featureChanged('x');
  t.deepEqual(store.getChangedIds(), ['x']);
  store.featureChanged('y');
  t.deepEqual(store.getChangedIds(), ['x', 'y']);
  store.featureChanged('x');
  t.deepEqual(store.getChangedIds(), ['x', 'y'], 'ids do not duplicate');
  store.clearChangedIds();
  t.deepEqual(store.getChangedIds(), []);
  t.end();
});

test('Store#add, Store#get, Store#getAll', t => {
  const store = createStore();
  t.equal(store.get(1), undefined);
  t.deepEqual(store.getAll(), []);
  const point = createFeature('point');
  const line = createFeature('line');
  store.add(point);
  t.equal(store.get(point.id), point);
  t.deepEqual(store.getAll(), [point]);
  store.add(line);
  t.equal(store.get(point.id), point);
  t.equal(store.get(line.id), line);
  t.deepEqual(store.getAll(), [point, line]);
  store.add(point);
  t.equal(store.get(point.id), point);
  t.equal(store.get(line.id), line);
  t.deepEqual(store.getAll(), [point, line]);
  t.end();
});

test('selection methods', t => {
  const store = createStore();
  const f1 = createFeature('point');
  store.add(f1);
  const f2 = createFeature('point');
  store.add(f2);
  const f3 = createFeature('point');
  store.add(f3);
  const f4 = createFeature('point');
  store.add(f4);

  t.deepEqual(store.getSelectedIds(), []);

  t.test('select one feature', st => {
    store.select(f1.id);
    st.deepEqual(store.getSelectedIds(), [f1.id], 'f1 returns in selected ids array');
    st.deepEqual(store.getSelected(), [f1.toGeoJSON()], 'f1 returns in selected array');
    st.equal(store.isSelected(f1.id), true, 'isSelected affirms f1');
    st.equal(store.isSelected(f2.id), false, 'isSelected rejects f2');
    st.end();
  });

  t.test('select a second feature', st => {
    store.select(f2.id);
    st.deepEqual(store.getSelectedIds(), [f1.id, f2.id], 'f1 and f2 return in selected ids array');
    st.deepEqual(store.getSelected(), [f1, f2], 'f1 and f2 return in selected array');
    st.equal(store.isSelected(f1.id), true, 'isSelected affirms f1');
    st.equal(store.isSelected(f2.id), true, 'isSelected affirms f2');
    st.end();
  });

  t.test('try to re-select first feature', st => {
    store.select(f1.id);
    st.end();
  });

  t.test('deselect a feature', st => {
    store.deselect(f1.id);
    st.deepEqual(store.getSelectedIds(), [f2.id], 'deselection of f1 clears it from selected array');
    st.end();
  });

  t.test('serially select more features', st => {
    store.select(f3.id);
    store.select(f4.id);
    st.deepEqual(store.getSelectedIds(), [f2.id, f3.id, f4.id], 'serial selection of f3 and f4 reflected in selected array');
    st.end();
  });

  t.test('clear selection', st => {
    store.clearSelected();
    st.deepEqual(store.getSelectedIds(), []);
    st.end();
  });

  t.test('select an array of features', st => {
    store.select([f1.id, f3.id, f4.id]);
    st.deepEqual(store.getSelectedIds(), [f1.id, f3.id, f4.id]);
    st.end();
  });

  t.test('deselect an array of features', st => {
    store.deselect([f1.id, f4.id]);
    st.deepEqual(store.getSelectedIds(), [f3.id]);
    st.end();
  });

  t.end();
});

test('Store#delete', t => {
  const store = createStore();
  const point = createFeature('point');
  const line = createFeature('line');
  const polygon = createFeature('polygon');

  store.add(point);
  store.add(line);
  store.add(polygon);
  t.deepEqual(store.getAll(), [point, line, polygon]);
  t.deepEqual(store.getAllIds(), [point.id, line.id, polygon.id]);

  t.deepEqual(store.getSelectedIds(), []);
  store.select(line.id);
  t.deepEqual(store.getSelectedIds(), [line.id]);

  store.delete(line.id);
  t.deepEqual(store.getAll(), [point, polygon]);
  t.deepEqual(store.getAllIds(), [point.id, polygon.id]);
  t.deepEqual(store.getSelectedIds(), []);
  t.equal(store.isDirty, true, 'after deletion store is dirty');

  t.end();
});

test('Store#setSelected', t => {
  const store = createStore();
  const point = createFeature('point');
  const line = createFeature('line');
  const polygon = createFeature('polygon');

  store.setSelected(point.id);
  t.deepEqual(store.getSelectedIds(), [point.id]);

  store.setSelected([line.id, polygon.id]);
  t.deepEqual(store.getSelectedIds(), [line.id, polygon.id]);

  store.setSelected(line.id);
  t.deepEqual(store.getSelectedIds(), [line.id]);

  store.setSelected();
  t.deepEqual(store.getSelectedIds(), []);

  t.end();
});

test('Store#setFeatureProperty', t => {
  const store = createStore();
  const point = createFeature('point');

  store.add(point);
  store.clearChangedIds();
  store.setFeatureProperty(point.id, 'size', 200);
  t.deepEqual(store.getChangedIds(), [point.id]);
  t.equal(store.get(point.id).properties.size, 200, 'sets the property on the feature');

  t.end();
});

