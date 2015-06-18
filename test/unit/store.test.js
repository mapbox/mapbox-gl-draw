var Store = require('../../src/store.js');
var test = require('tape');

test('store has correct properties', (t) => {
  t.ok(Store, 'store exists');
  console.log(Store);
  t.end();
});

