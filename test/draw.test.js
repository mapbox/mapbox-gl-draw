import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;

var map = createMap();

var Draw = Draw = GLDraw();

test.skip('Draw class test', t => {

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
