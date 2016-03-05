import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import {createMap, features } from './utils';

var feature = features.square;

test('Square geometry class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  map.on('load', function() {

    Draw.startDrawing(Draw.types.SQUARE);

    let coords = feature.geometry.coordinates;

    map.fire('click', {
      lngLat: {
        lng: 1,
        lat: 1
      }
    });

    map.fire('click', {
      lngLat: {
        lng: 2,
        lat: 2
      }
    });

    var feats = Draw.getAll().features;
    t.equals(1, feats.length, 'only one');
    t.equals('Polygon', feats[0].geometry.type, 'of the right type');
    t.deepEquals(coords, feats[0].geometry.coordinates, 'in the right spot');
    t.end();
  })

});
