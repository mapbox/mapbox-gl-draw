'use strict';

var test = require('tape');
var mapboxgl = require('mapbox-gl');
var Draw = require('../src/draw.js');

function createMap() {
  var mapEl = document.createElement('div');

  return new mapboxgl.Map({
    container: mapEl,
    interactive: false,
    attributionControl: false
  });
}

test('rendered control buttons', (t) => {
  var map = createMap();
  var drawControls = Draw();
  map.addControl(drawControls);

  t.ok(drawControls.markerCtrl, 'Marker controller button exists');
  t.ok(drawControls.lineStringCtrl, 'LineString controller button exists');
  t.ok(drawControls.squareCtrl, 'Square controller button exists');
  t.ok(drawControls.polygonCtrl, 'Polygon controller button exists');

  t.end();
});
