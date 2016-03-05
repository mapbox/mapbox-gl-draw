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

test('draw.set event', t => {
  t = timeout(t, 100, 'draw.set not fired when drawing is done');
  map.on('draw.set', function(e) {
    if (t.notDone()) {
      t.pass('draw.set fired when drawing is done');
      t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
      t.end();
    }
  });
  Draw.startDrawing(Draw.types.POINT);

  map.fire('click', {
    lngLat: {
      lng: 10,
      lat: 10
    }
  });
});

test('draw.delete event', t => {
  t = timeout(t, 100, 'failed to fire draw.delete');
  map.once('draw.delete', e => {
    if(t.notDone()) {
      t.pass('draw.delete fired on delete');
      t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
      t.equals(e.geojson.id, id, 'draw id in payload is correct');
      Draw.deselect();
      t.end();
    }
  });
  let id = Draw.add(feature);
  Draw.destroy(id);
});

test('draw.select.start event', t => {
  t = timeout(t, 100, 'failed to fire draw.select.start');
  map.once('draw.select.start', e => {
    if(t.notDone()) {
      t.pass('draw.select.start fired on select');
      t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
      t.equals(e.geojson.id, id, 'draw id in payload is correct');
      Draw.deselect();
      t.end();
    }
  });
  let id = Draw.add(feature);
  Draw.select(id);
});

test('draw.select.end event', t => {
  t = timeout(t, 100, 'failed to fire draw.select.end');
  map.once('draw.select.end', e => {
    if(t.notDone()) {
      t.pass('draw.select.end fired on select end');
      t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
      t.equals(e.geojson.id, id, 'draw id in payload is correct');
      t.end();
    }
  });
  let id = Draw.add(feature);
  Draw.select(id);
  Draw.deselect(id);
});
