var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../../');

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

test('Draw class test', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  t.ok(Draw, 'Draw class exists');

  t.ok(Draw.options, 'Draw.options is defined');

  // check for all methods
  t.ok(Draw.onAdd, 'onAdd method exists');
  t.ok(Draw._onKeyUp, '_onKeyUp method exists');
  t.ok(Draw._onClick, '_onClick method exists');
  t.ok(Draw._edit, '_edit method exists');
  t.ok(Draw._finish, '_finish method exists');
  t.ok(Draw._exitEdit, '_exitEdit method exists');
  t.ok(Draw._initiateDrag, '_initiateDrag method exists');
  t.ok(Draw._drag, '_drag method exists');
  t.ok(Draw._endDrag, '_endDraw method exists');
  t.ok(Draw._drawPolygon, '_drawPolygon method exists');
  t.ok(Draw._drawLine, '_drawLine method exists');
  t.ok(Draw._drawSquare, '_drawSquare method exists');
  t.ok(Draw._drawPoint, '_drawPoint method exists');
  t.ok(Draw._destroy, '_destroy method exists');
  t.ok(Draw.addGeometry, 'addGeometry method exists');
  t.ok(Draw.removeGeometry, 'removeGeometry method exists');
  t.ok(Draw.get, 'get method exists');
  t.ok(Draw.getAll, 'getAll method exists');
  t.ok(Draw.clear, 'clear method exists');
  t.ok(Draw.clearAll, 'clearAll method exists');
  t.ok(Draw._createButton, '_createButton method exists');
  t.ok(Draw._mapState, '_mapState method exists');

  // check for event listeners
  t.ok(Draw.drag, 'drag event listener function exists');
  t.ok(Draw.onClick, 'onClick event listener function exists');
  t.ok(Draw.onKeyUp, 'onKeyUp event listener function exists');
  t.ok(Draw.endDrag, 'endDrag event listener function exists');
  t.ok(Draw.initiateDrag, 'initiateDrag event listener function exists');

  t.end();
});
