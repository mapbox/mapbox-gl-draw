/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.point;

var map = createMap();

map.on('load', () => {

  test('Events test', t => {

    var Draw = GLDraw();
    map.addControl(Draw);

    t.test('draw.set event', t => {
      map.once('draw.set', e => {
        t.pass('draw.set fired on add');
        t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
        t.end();
      });
      Draw.add(feature);
    });

    t.test('draw.delete event', t => {
      map.once('draw.delete', e => {
        t.pass('draw.delete fired on delete');
        t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
        t.equals(e.geojson.id, id, 'draw id in payload is correct');
        t.end();
      });
      let id = Draw.add(feature);
      Draw._select(id);
      Draw._destroy();
    });

    t.test('draw.select.start event', t => {
      map.once('draw.select.start', e => {
        t.pass('draw.select.start fired on select');
        t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
        t.equals(e.geojson.id, id, 'draw id in payload is correct');
        Draw._handleDrawFinished();
        t.end();
      });
      let id = Draw.add(feature);
      Draw._select(id);
    });

    t.test('draw.select.end event', t => {
      map.once('draw.select.end', e => {
        t.pass('draw.select.end fired on select end');
        t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
        t.equals(e.geojson.id, id, 'draw id in payload is correct');
        t.end();
      });
      let id = Draw.add(feature);
      Draw._select(id);
      Draw._handleDrawFinished();
    });

    t.end();
  });

});
