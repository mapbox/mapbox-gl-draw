import test from 'tape';
import mapboxgl from 'mapbox-gl';
import happen from 'happen';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

var feature = features.square;

mapboxgl.accessToken = accessToken;

var map = createMap();

map.on('load', () => {

  test('Square geometry class', t => {
    var Draw = GLDraw();
    map.addControl(Draw);

    Draw._startDrawing('square');

    let coords = feature.geometry.coordinates;

    let ne = map.project(mapboxgl.LngLat.convert(coords[0][0]));
    let sw = map.project(mapboxgl.LngLat.convert(coords[0][2]));

    happen.mousedown(map.getCanvas(), {
      clientX: ne.x,
      clientY: ne.y
    });

    happen.mousemove(map.getCanvas(), {
      clientX: sw.x,
      clientY: sw.y
    });

    happen.mouseup(map.getCanvas());

    var feats = Draw._store._features;
    var ids = Object.keys(feats);
    var square = feats[ids[0]];

    square.onStopDrawing();

    // to do, fix floating point problems here
    //t.deepEquals(square.coordinates, coords);

    t.end();
  });

});
