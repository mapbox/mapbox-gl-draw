var test = require('tape');
var mapboxgl = require('mapbox-gl');
var GLDraw = require('../');
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;

var map = createMap();

map.on('load', () => {

  var Draw;

  test('Draw class test', t => {
    Draw = GLDraw();
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

    // test selected mode
    // TO DO

    t.end();
  });

  test('Draw without handlers', t => {
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

  test('Draw without drawing', t => {
    Draw = GLDraw({
      drawing: false
    });

    t.doesNotThrow(Draw._showDeleteButton.bind(Draw),
    'calling _showDeleteButton with drawing disabled does not throw an error');

    t.doesNotThrow(Draw._hideDeleteButton.bind(Draw),
    'calling _hideDeleteButton with drawing disabled does not throw an error');

    t.end();
  });

});
