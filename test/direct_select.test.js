/* eslint no-shadow:[0] */
import test from 'tape';
import GLDraw from '../';
import click from './utils/mouse_click';
import getGeoJSON from './utils/get_geojson';
import createMap from './utils/create_map';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import AfterNextRender from './utils/after_next_render';
import makeMouseEvent from './utils/make_mouse_event';
import Constants from '../src/constants';

test('direct_select', t => {

  const map = createMap();
  spy(map, 'fire');

  const Draw = GLDraw();
  map.addControl(Draw);

  const afterNextRender = AfterNextRender(map);

  const cleanUp = function(cb) {
    Draw.deleteAll();
    map.fire.reset();
    if (cb) {
      afterNextRender(cb);
    }
  };

  t.test('direct_select - init map for tests', t => {
    const done = function() {
      map.off('load', done);
      t.end();
    };
    if (map.loaded()) {
      done();
    }
    else {
      map.on('load', done);
    }
  });

  t.test('direct_select - a click on a vertex and than dragging the map shouldn\'t drag the vertex', t => {
    var ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });

    var clickAt = getGeoJSON('polygon').geometry.coordinates[0][0];
    afterNextRender(() => {
      click(map, makeMouseEvent(clickAt[0], clickAt[1]));
      afterNextRender(() => {
        map.fire('mousedown', makeMouseEvent(clickAt[0] + 15, clickAt[1] + 15));
        map.fire('mousemove', makeMouseEvent(clickAt[0] + 30, clickAt[1] + 30));
        map.fire('mouseup', makeMouseEvent(clickAt[0] + 30, clickAt[1] + 30));
        var afterMove = Draw.get(ids[0]);
        t.deepEquals(getGeoJSON('polygon').geometry, afterMove.geometry, 'should be the same after the drag');
        cleanUp(() => t.end());
      });
    });
  });
});
