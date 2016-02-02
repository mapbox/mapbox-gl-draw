/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.point;

var map = createMap();

test('Events test', t => {

  map.on('load', () => {

    var Draw = GLDraw();
    map.addControl(Draw);

    t.skip('draw.set event', t => {
      var waiting = true;
      var handler = function(e) {
        if(waiting) {
          waiting = false;
          t.pass('draw.set fired on add');
          t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
          t.end();
        }
      };
      map.once('draw.set', handler);
      var id = Draw.add(feature);
      Draw.select(id);

      setTimeout(() => {
        if(waiting) {
          waiting = false;
          map.off(handler);
          t.fail('draw.set wasn\'t called');
          t.end();
        }
      }, 1000);
    });

    t.skip('draw.delete event', t => {
      map.once('draw.delete', e => {
        t.pass('draw.delete fired on delete');
        t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
        t.equals(e.geojson.id, id, 'draw id in payload is correct');
        Draw.deselect();
        t.end();
      });
      let id = Draw.add(feature);
      Draw.select(id);
    });

    t.skip('draw.select.start event', t => {
      map.once('draw.select.start', e => {
        t.pass('draw.select.start fired on select');
        t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
        t.equals(e.geojson.id, id, 'draw id in payload is correct');
        Draw.deselect();
        t.end();
      });
      let id = Draw.add(feature);
      Draw.select(id);
    });

    t.skip('draw.select.end event', t => {
      map.once('draw.select.end', e => {
        t.pass('draw.select.end fired on select end');
        t.deepEquals(e.geojson.geometry, feature.geometry, 'geojson in payload is the same as set');
        t.equals(e.geojson.id, id, 'draw id in payload is correct');
        t.end();
      });
      let id = Draw.add(feature);
      Draw.select(id);
      Draw.deselect();
    });

    t.end();
  });

});
