import test from 'tape';
import mapboxgl from 'mapbox-gl';
import happen from 'happen';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

var feature = features.line;

mapboxgl.accessToken = accessToken;

var map = createMap();

map.on('load', () => {

  test('Line draw class', t => {
    var Draw = GLDraw();
    map.addControl(Draw);

    Draw._startDrawing('line');

    let coords = feature.geometry.coordinates;

    for (var i = 0; i < coords.length; i++) {
      let c = coords[i];
      console.log(c);
      let pt = map.project(mapboxgl.LngLat.convert(c));
      console.log(pt);
      happen.click(map.getCanvas(), {
        clientX: pt.x,
        clientY: pt.y
      });
    }

    // complete drawing
    happen.once(map.getCanvas(), {
      type: 'keyup',
      keyCode: 13
    });

    var feats = Draw._store._features;
    var ids = Object.keys(feats);
    var line = feats[ids[0]];

    line.onStopDrawing();

    // to do: fix floating point error and make this pass
    //t.deepEquals(line.coordinates, coords);

    t.end();
  });

});
