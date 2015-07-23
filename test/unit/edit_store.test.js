var EditStore = require('../../src/edit_store');
var test = require('tape');

test('Edit store has correct properties', t => {
  t.ok(EditStore, 'edit store exists');
  t.ok(typeof EditStore === 'function', 'edit store is a function');
  t.end();
});

test('Edit store constructor', t => {
  t.end();
  /*
  var map = new mapboxgl.Map({};
  var editStore = new EditStore(map, []);

  t.ok(typeof editStore.getAll === 'function', 'get exists');
  t.ok(typeof editStore.getById === 'function', 'getById exists');
  t.ok(typeof editStore.clear === 'function', 'clear exists');
  t.ok(typeof editStore.update === 'function', 'update exists');

  t.end();
});

test('Edit store functions', t => {
  var polygonGeoJSON = [{
    type: 'Feature',
    properties: {
      _drawid: 123
    },
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
  var editStore = new EditStore(polygonGeoJSON);

  t.deepEquals(polygonGeoJSON, editStore.getAll().features, 'getAll returns array with inputted geojson');
  t.deepEquals(polygonGeoJSON[0], editStore.getById(polygonGeoJSON[0].properties._drawid), 'getById returns inputted geojson');

  editStore.clear();
  t.deepEquals([], editStore.getAll().features, 'clear clears the store');

  t.end();
  */
});
