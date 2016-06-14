import test from 'tape';
import SimpleSet from '../src/lib/simple_set';

test('SimpleSet constructor and API', t => {
  const set = new SimpleSet();
  t.deepEqual(set.values(), [], 'empty by default');
  t.equal(Object.keys(set).filter(k => k[0] !== '_').length, 0, 'no unexpected properties');
  // Methods
  t.equal(typeof SimpleSet.prototype.add, 'function', 'exposes set.add');
  t.equal(typeof SimpleSet.prototype.delete, 'function', 'exposes set.delete');
  t.equal(typeof SimpleSet.prototype.has, 'function', 'exposes set.has');
  t.equal(typeof SimpleSet.prototype.values, 'function', 'exposes set.values');
  t.equal(typeof SimpleSet.prototype.clear, 'function', 'exposes set.clear');
  t.equal(Object.keys(SimpleSet.prototype).filter(k => k[0] !== '_').length, 5, 'no unexpected methods');

  const populatedSet = new SimpleSet([1, 2]);
  t.deepEqual(populatedSet.values(), [1, 2], 'populated by constructor arg');

  t.end();
});

test('SimpleSet#add', t => {
  const set = new SimpleSet();
  t.deepEqual(set.values(), []);
  set.add(1);
  t.deepEqual(set.values(), [1]);
  set.add(2);
  t.deepEqual(set.values(), [1, 2]);
  set.add(1);
  t.deepEqual(set.values(), [1, 2]);
  t.end();
});

test('SimpleSet#delete', t => {
  const set = new SimpleSet([1, 2]);
  set.delete(1);
  t.deepEqual(set.values(), [2]);
  set.delete(1);
  t.deepEqual(set.values(), [2]);
  set.delete();
  t.deepEqual(set.values(), [2]);
  set.delete(2);
  t.deepEqual(set.values(), []);
  t.end();
});

test('SimpleSet#has', t => {
  const set = new SimpleSet([1, 2]);
  t.equal(set.has(1), true);
  t.equal(set.has(2), true);
  t.equal(set.has(3), false);
  t.end();
});

test('SimpleSet#values', t => {
  const set = new SimpleSet([1, 2]);
  t.deepEqual(set.values(), [1, 2]);
  t.end();
});

test('SimpleSet#clear', t => {
  const set = new SimpleSet([1, 2]);
  set.clear();
  t.deepEqual(set.values(), []);
  t.end();
});
