var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../');
var Store = require('../src/store');

mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q';

function createMap() {
  var div = document.createElement('div');
  div.setAttribute('id', 'map');
  document.body.appendChild(div);

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'https://www.mapbox.com/mapbox-gl-styles/styles/mapbox-streets-v7.json'
  });

  return map;
}

var feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Point',
    coordinates: [0, 0]
  }
};

test('Draw class test', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  t.ok(Draw, 'Draw class exists');

  t.ok(Draw.options, 'Draw.options is defined');

  // check for all methods
  t.equals(typeof Draw.onAdd, 'function', 'onAdd method exists');
  t.equals(typeof Draw._onKeyUp,'function', '_onKeyUp method exists');
  t.equals(typeof Draw._onClick, 'function', '_onClick method exists');
  t.equals(typeof Draw._edit, 'function', '_edit method exists');
  t.equals(typeof Draw._finish, 'function', '_finish method exists');
  t.equals(typeof Draw._exitEdit, 'function', '_exitEdit method exists');
  t.equals(typeof Draw._initiateDrag, 'function', '_initiateDrag method exists');
  t.equals(typeof Draw._drag, 'function', '_drag method exists');
  t.equals(typeof Draw._endDrag, 'function', '_endDraw method exists');
  t.equals(typeof Draw._drawPolygon, 'function', '_drawPolygon method exists');
  t.equals(typeof Draw._drawLine, 'function', '_drawLine method exists');
  t.equals(typeof Draw._drawSquare, 'function', '_drawSquare method exists');
  t.equals(typeof Draw._drawPoint, 'function', '_drawPoint method exists');
  t.equals(typeof Draw._destroy, 'function', '_destroy method exists');
  t.equals(typeof Draw.addGeometry, 'function', 'addGeometry method exists');
  t.equals(typeof Draw.removeGeometry, 'function', 'removeGeometry method exists');
  t.equals(typeof Draw.get, 'function', 'get method exists');
  t.equals(typeof Draw.getAll, 'function', 'getAll method exists');
  t.equals(typeof Draw.clear, 'function', 'clear method exists');
  t.equals(typeof Draw.clearAll, 'function', 'clearAll method exists');
  t.equals(typeof Draw._createButton, 'function', '_createButton method exists');
  t.equals(typeof Draw._mapState, 'function', '_mapState method exists');

  // check for event listeners
  t.equals(typeof Draw.drag, 'function', 'drag event listener function exists');
  t.equals(typeof Draw.onClick, 'function', 'onClick event listener function exists');
  t.equals(typeof Draw.onKeyUp, 'function', 'onKeyUp event listener function exists');
  t.equals(typeof Draw.endDrag, 'function', 'endDrag event listener function exists');
  t.equals(typeof Draw.initiateDrag, 'function', 'initiateDrag event listener function exists');

  // class member objects are of the correct type
  t.ok(Draw._map instanceof mapboxgl.Map, 'this._map is an instance of mapboxgl.Map');
  t.ok(Draw._store instanceof Store, 'Draw._store is an instance of the store class');

  // check for control buttons in the DOM
  t.ok(
    document.getElementById('lineDrawBtn'),
    'line draw button is in the DOM'
  );
  t.ok(
    document.getElementById('polygonDrawBtn'),
    'polygon draw button is in the DOM'
  );
  t.ok(
    document.getElementById('squareDrawBtn'),
    'square draw button is in the DOM'
  );
  t.ok(
    document.getElementById('pointDrawBtn'),
    'point draw button is in the DOM'
  );

  // test edit mode
  var id = Draw.set(feature);
  var f = Draw.get(id).properties.drawId;
  Draw._edit(f);
  t.ok(
    document.getElementById('deleteBtn'),
    'whilst in edit mode, the delete button is added to the DOM'
  );
  Draw._finish();
  Draw._exitEdit();
  t.notOk(
    document.getElementById('deleteBtn'),
    'delete button is removed on at the end of edit'
  );
  Draw.clearAll();

  // delete feature
  Draw.set(feature);
  /*
  f = Draw.getAll().features[0];
  Draw._edit(f);
  Draw._destroy(f.properties.drawId);
  t.equals(Draw.getAll().features.length, 0, 'Draw._destroy removes the geometry from the store');
  */

  t.end();
});
