import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.polygon;

var map = createMap();

map.on('load', () => {

  test('Polygon geometry class', t => {
    var Draw = GLDraw();
    map.addControl(Draw);

    Draw._startDrawing('polygon');
    let coords = feature.geometry.coordinates[0];
    for (var i = 0; i < coords.length - 1; i++) {
      let c = coords[i];
      map.fire('click', {
        lngLat: {
          lng: c[0],
          lat: c[1]
        }
      });
    }

    // simulate mousemove behavior
    // TO DO:
    //    make this less totally garbage
    map.fire('click', {
      lngLat: {
        lng: coords[coords.length - 2][0],
        lat: coords[coords.length - 2][1]
      }
    });

    Draw._events.onDoubleClick();

    var feats = Draw._store._features;
    var ids = Object.keys(feats);
    var poly = feats[ids[0]];

    t.deepEquals(poly.coordinates, feature.geometry.coordinates);

    t.end();
  });

});
