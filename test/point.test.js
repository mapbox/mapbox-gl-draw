import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { createMap } from './utils';

test('Point geometry class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  map.on('load', function() {
    Draw.changeMode('draw_point');
    map.fire('click', {
      lngLat: {
        lng: 10,
        lat: 10
      },
      point: {
        x: 0,
        y: 0
      }
    });

    var feats = Draw.getAll().features;
    t.equals(1, feats.length, 'only one');
    t.equals('Point', feats[0].geometry.type, 'of the right type');
    t.deepEquals([10, 10], feats[0].geometry.coordinates, 'in the right spot');

    t.end();
  });

});
