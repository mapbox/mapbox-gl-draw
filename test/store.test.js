/* eslint no-shadow:[0] */
import test from 'tape';
import Store from '../src/store';
import { createMap, createFeature, getPublicMemberKeys } from './test_utils';

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
  t.equal(typeof Store.prototype.isSelected, 'function', 'exposes store.isSelected');
  t.equal(typeof Store.prototype.delete, 'function', 'exposes store.delete');
  t.equal(typeof Store.prototype.setSelected, 'function', 'exposes store.setSelected');

  t.equal(getPublicMemberKeys(Store.prototype).length, 15, 'no untested prototype members');

  t.end();
});

test('Store#setDirty', t => {
  const store = createStore();
  t.equal(store.isDirty, false);
  store.setDirty();
  t.equal(store.isDirty, true);
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

test('Store#select, Store#deselect, Store#getSelectedIds, Store#isSelected, Store#isSelected', t => {
  const store = createStore();
  t.deepEqual(store.getSelectedIds(), []);
  store.select(1);
  t.deepEqual(store.getSelectedIds(), [1]);
  t.equal(store.isSelected(1), true);
  t.equal(store.isSelected(2), false);
  store.select(2);
  t.deepEqual(store.getSelectedIds(), [1, 2]);
  t.equal(store.isSelected(1), true);
  t.equal(store.isSelected(2), true);
  store.select(1);
  t.deepEqual(store.getSelectedIds(), [1, 2]);
  store.deselect(1);
  t.deepEqual(store.getSelectedIds(), [2]);
  store.select(3);
  store.select(4);
  t.deepEqual(store.getSelectedIds(), [2, 3, 4]);
  store.clearSelected();
  t.deepEqual(store.getSelectedIds(), []);
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

  let deletedFeatureIdsReported = [];
  store.ctx.map.on('draw.deleted', data => {
    deletedFeatureIdsReported = data.featureIds;
  });

  store.delete(line.id);
  t.deepEqual(store.getAll(), [point, polygon]);
  t.deepEqual(store.getAllIds(), [point.id, polygon.id]);
  t.deepEqual(store.getSelectedIds(), []);

  t.equal(store.isDirty, true, 'after deletion store is dirty');
  t.deepEqual(deletedFeatureIdsReported, [line], 'draw.deleted event fires with data');

  t.end();
});

test('Store#setSelected', t => {
  const store = createStore();
  t.deepEqual(store.getSelectedIds(), []);
  store.setSelected(1);
  t.deepEqual(store.getSelectedIds(), [1]);
  store.setSelected([3, 4]);
  t.deepEqual(store.getSelectedIds(), [3, 4]);
  store.setSelected();
  t.deepEqual(store.getSelectedIds(), []);
  t.end();
});
