import test from 'node:test';
import assert from 'node:assert/strict';
import StringSet from '../src/lib/string_set.js';

test('StringSet constructor and API', () => {
  const set = new StringSet();
  assert.deepEqual(set.values(), [], 'empty by default');
  assert.equal(Object.keys(set).filter(k => k[0] !== '_').length, 0, 'no unexpected properties');
  // Methods
  assert.equal(typeof StringSet.prototype.add, 'function', 'exposes set.add');
  assert.equal(typeof StringSet.prototype.delete, 'function', 'exposes set.delete');
  assert.equal(typeof StringSet.prototype.has, 'function', 'exposes set.has');
  assert.equal(typeof StringSet.prototype.values, 'function', 'exposes set.values');
  assert.equal(typeof StringSet.prototype.clear, 'function', 'exposes set.clear');
  assert.equal(Object.keys(StringSet.prototype).filter(k => k[0] !== '_').length, 5, 'no unexpected methods');

  const populatedSet = new StringSet(['a', 4, 'b']);
  assert.deepEqual(populatedSet.values(), ['a', 4, 'b'], 'populated by constructor arg');
});

test('StringSet#add', () => {
  const set = new StringSet();
  assert.deepEqual(set.values(), []);
  set.add('a');
  assert.deepEqual(set.values(), ['a']);
  set.add('b');
  assert.deepEqual(set.values(), ['a', 'b']);
  set.add('a');
  assert.deepEqual(set.values(), ['a', 'b']);
  set.add(3);
  assert.deepEqual(set.values(), ['a', 'b', 3]);
});

test('StringSet#delete', () => {
  const subject = ['a', 'b', 2];
  const set = new StringSet(subject);
  set.delete('a');
  assert.deepEqual(set.values(), ['b', 2]);
  set.delete('a');
  assert.deepEqual(set.values(), ['b', 2]);
  set.delete();
  assert.deepEqual(set.values(), ['b', 2]);
  set.delete('b');
  assert.deepEqual(set.values(), [2]);
  set.delete(2);
  assert.deepEqual(set.values(), []);
  assert.deepEqual(subject, ['a', 'b', 2], 'source array not mutated');
});

test('StringSet#has', () => {
  const set = new StringSet(['a', 'b', 2]);
  assert.equal(set.has('a'), true);
  assert.equal(set.has('b'), true);
  assert.equal(set.has(2), true);
  assert.equal(set.has('c'), false);
  assert.equal(set.has(4), false);
});

test('StringSet#values', () => {
  const subject = ['a', 'b'];
  const set = new StringSet(subject);
  assert.deepEqual(set.values(), ['a', 'b']);
  assert.notEqual(set.values(), subject, 'array is copied, so source array is not mutable');
});

test('StringSet#clear', () => {
  const set = new StringSet(['a', 'b']);
  set.clear();
  assert.deepEqual(set.values(), []);
});
