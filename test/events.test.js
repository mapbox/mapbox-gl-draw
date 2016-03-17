/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.point;

var map = createMap();

var timeout = function(t, time, msg) {
  var end = t.end.bind(t);

  var done = false;

  setTimeout(function() {
    if(t.notDone()) {
      done = true;
      t.fail(msg || 'Timed out');
      t.end();
    }
  })

  t.notDone = function() {
    return !done;
  }

  t.end = function() {
    done = true;
    end();
  }

  return t;
}

var Draw = GLDraw();
map.addControl(Draw);

test('draw.deleted event', t => {
  t = timeout(t, 100, 'failed to fire draw.deleted');
  map.once('draw.deleted', e => {
    if(t.notDone()) {
      t.pass('draw.deleted fired on deleted');
      t.deepEquals(e[0].geometry, feature.geometry, 'geojson in payload is the same as set');
      t.equals(e[0].id, id, 'draw id in payload is correct');
      t.end();
    }
  });
  let id = Draw.add(feature);
  Draw.delete(id);
});
