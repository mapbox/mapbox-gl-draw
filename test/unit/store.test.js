var Store = require('../../src/store.js');
var test = require('tape');
var Immutable = require('immutable');

test('Store has correct properties', (t) => {
  t.ok(Store, 'store exists');
  t.ok(typeof Store === 'function', 'store is a function');
  t.end();
});

test('Store constructor', (t) => {
  var store = new Store([]);
  t.equals(store.historyIndex, 0, 'historyIndex starts at zero');

  t.ok(store.history, 'history exists');
  t.equals(store.history.length, 2, 'history has two elements');
  t.ok(store.history[0] instanceof Immutable.List, 'history has a list');
  t.equals(store.history[0].count(), 0, 'history\'s list is empty');
  t.ok(store.history[1] instanceof Immutable.Map, 'history has a map');
  t.equals(store.history[1].count(), 0, 'history\'s map is empty');

  t.ok(store.annotations, 'annotations exists');
  t.equals(store.annotations.length, 1, 'annotations has one element');
  t.ok(store.annotations[0] instanceof Immutable.List, 'annotations has a list');
  t.equals(store.annotations[0].count(), 0, 'annotations\' list is empty');

  t.ok(store.operation, 'operation exists');
  t.ok(store.getAll, 'getAll exists');
  t.ok(store.clear, 'clear exists');
  t.ok(store.get, 'get exists');
  t.ok(store.set, 'set exists');
  t.ok(store.redo, 'redo exists');
  t.ok(store.undo, 'undo exists');

  t.end();
});

test('Store constructor with data', (t) => {
  var polygonGeoJSON = [{
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [1,1],
          [1,2],
          [2,1],
          [1,1]
        ]
      ]
    }
  }];
  var store = new Store(polygonGeoJSON);

  t.equals(store.history.length, 2, 'history has two elements');
  t.ok(store.history[0] instanceof Immutable.List, 'history has a list');
  t.equals(store.history[0].count(), 0, 'history\'s list is empty');
  t.ok(store.history[1] instanceof Immutable.Map, 'history has a map');
  t.deepEquals(store.history[1].toJS(), polygonGeoJSON, 'history\'s map equals the inputted geoJSON');
  console.log(store.history[1]);

  t.end();
});
