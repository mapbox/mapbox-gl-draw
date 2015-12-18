var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../');
var Store = require('../src/store');
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;

test('Draw class test', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  t.ok(Draw, 'Draw class exists');

  t.ok(Draw.options, 'Draw.options is defined');

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
