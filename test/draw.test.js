var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../');
var Store = require('../src/store');
var EditStore = require('../src/edit_store');
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;

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
  t.equals(typeof Draw._finishEdit, 'function', '_finishEdit method exists');
  t.equals(typeof Draw._initiateDrag, 'function', '_initiateDrag method exists');
  t.equals(typeof Draw._drag, 'function', '_drag method exists');
  t.equals(typeof Draw._endDrag, 'function', '_endDraw method exists');
  t.equals(typeof Draw._drawPolygon, 'function', '_drawPolygon method exists');
  t.equals(typeof Draw._drawLine, 'function', '_drawLine method exists');
  t.equals(typeof Draw._drawSquare, 'function', '_drawSquare method exists');
  t.equals(typeof Draw._drawPoint, 'function', '_drawPoint method exists');
  t.equals(typeof Draw._destroy, 'function', '_destroy method exists');
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
  t.ok(Draw._editStore instanceof EditStore, 'Draw._editStore is an instance of edit store class');

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
  // TO DO

  t.end();
});

test('Draw without handlers', t => {
  var map = createMap();
  GLDraw({
    controls: {}
  });

  try {
    map.fire('drawing.end');
  } catch (e) {
    t.fail('calling drawing.end without handlers throws');
  }

  t.end();
});
