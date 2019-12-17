import test from 'tape';
import StringSet from '../src/lib/string_set';

test('StringSet constructor and API', (t) => {
  const set = new StringSet();
  t.deepEqual(set.values(), [], 'empty by default');
  t.equal(Object.keys(set).filter(k => k[0] !== '_').length, 0, 'no unexpected properties');
  // Methods
  t.equal(typeof StringSet.prototype.add, 'function', 'exposes set.add');
  t.equal(typeof StringSet.prototype.delete, 'function', 'exposes set.delete');
  t.equal(typeof StringSet.prototype.has, 'function', 'exposes set.has');
  t.equal(typeof StringSet.prototype.values, 'function', 'exposes set.values');
  t.equal(typeof StringSet.prototype.clear, 'function', 'exposes set.clear');
  t.equal(Object.keys(StringSet.prototype).filter(k => k[0] !== '_').length, 5, 'no unexpected methods');

  const populatedSet = new StringSet(['a', 4, 'b']);
  t.deepEqual(populatedSet.values(), ['a', 4, 'b'], 'populated by constructor arg');

  t.end();
});

test('StringSet#add', (t) => {
  const set = new StringSet();
  t.deepEqual(set.values(), []);
  set.add('a');
  t.deepEqual(set.values(), ['a']);
  set.add('b');
  t.deepEqual(set.values(), ['a', 'b']);
  set.add('a');
  t.deepEqual(set.values(), ['a', 'b']);
  set.add(3);
  t.deepEqual(set.values(), ['a', 'b', 3]);
  t.end();
});

test('StringSet#delete', (t) => {
  const subject = ['a', 'b', 2];
  const set = new StringSet(subject);
  set.delete('a');
  t.deepEqual(set.values(), ['b', 2]);
  set.delete('a');
  t.deepEqual(set.values(), ['b', 2]);
  set.delete();
  t.deepEqual(set.values(), ['b', 2]);
  set.delete('b');
  t.deepEqual(set.values(), [2]);
  set.delete(2);
  t.deepEqual(set.values(), []);
  t.deepEqual(subject, ['a', 'b', 2], 'source array not mutated');
  t.end();
});

test('StringSet#has', (t) => {
  const set = new StringSet(['a', 'b', 2]);
  t.equal(set.has('a'), true);
  t.equal(set.has('b'), true);
  t.equal(set.has(2), true);
  t.equal(set.has('c'), false);
  t.equal(set.has(4), false);
  t.end();
});

test('StringSet#values', (t) => {
  const subject = ['a', 'b'];
  const set = new StringSet(subject);
  t.deepEqual(set.values(), ['a', 'b']);
  t.doesNotEqual(set.values(), subject, 'array is copied, so source array is not mutable');
  t.end();
});

test('StringSet#clear', (t) => {
  const set = new StringSet(['a', 'b']);
  set.clear();
  t.deepEqual(set.values(), []);
  t.end();
});
