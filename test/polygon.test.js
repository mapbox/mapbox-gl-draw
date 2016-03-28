import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import {createMap, features } from './utils';

var feature = features.polygon;

test('Polygon geometry class', t => {
  var map = createMap();
  var Draw = GLDraw();
  map.addControl(Draw);

  map.on('load', function() {
    Draw.changeMode('draw_polygon');
    let coords = feature.geometry.coordinates[0];
    for (var i = 0; i < coords.length-1; i++) {
      var c = coords[i];
      map.fire('click',{
        lngLat: {
          lng: c[0],
          lat: c[1]
        },
        point: {
          x: 0,
          y: 0
        }
      });
    }

    map.fire('click', {
      lngLat: {
        lng: coords[coords.length - 2][0],
        lat: coords[coords.length - 2][1]
      },
      point: {
          x: 0,
          y: 0
        }
    });

    var feats = Draw.getAll().features;
    t.equals(1, feats.length, 'only one');
    t.equals('Polygon', feats[0].geometry.type, 'of the right type');
    console.log(feature.geometry.coordinates[0].length);
    t.equals(feature.geometry.coordinates[0].length, feats[0].geometry.coordinates[0].length, 'right number of points');
    t.deepEquals(feature.geometry.coordinates,    feats[0].geometry.coordinates, 'in the right spot');
    t.end();
  });
});
