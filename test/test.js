'use strict';

var test = require('tape');
var mapboxgl = require('mapbox-gl');
var Draw = require('../src/draw.js');
var util = require('../src/util.js');
var DOM = util.DOM;

function createMap() {
  var body = document.querySelector('body');
  var mapDiv = DOM.create('div', 'map', body);

  mapboxgl.accessToken = 'pk.eyJ1IjoidHJpc3RlbiIsImEiOiJiUzBYOEJzIn0.VyXs9qNWgTfABLzSI3YcrQ';
  return new mapboxgl.Map({
    container: mapDiv,
    zoom: 12,
    center: [43.6579, -79.3712],
    style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json'
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
