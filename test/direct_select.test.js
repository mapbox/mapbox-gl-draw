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
import createSyntheticEvent from 'synthetic-dom-events';

test('direct_select', t => {

  const mapContainer = document.createElement('div');
  document.body.appendChild(mapContainer);
  const map = createMap({ container: mapContainer });
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

  const getFireArgs = function() {
    const args = [];
    for (let i = 0; i < map.fire.callCount; i++) {
      args.push(map.fire.getCall(i).args);
    }
    return args;
  };

  t.test('direct_select - init map for tests', st => {
    const done = function() {
      map.off('load', done);
      st.end();
    };
    if (map.loaded()) {
      done();
    }
    else {
      map.on('load', done);
    }
  });

  t.test('direct_select - a click on a vertex and than dragging the map shouldn\'t drag the vertex', st => {
    var ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });

    var clickAt = getGeoJSON('polygon').geometry.coordinates[0][0];
    afterNextRender(() => {
      click(map, makeMouseEvent(clickAt[0], clickAt[1]));
      afterNextRender(() => {
        map.fire('mousedown', makeMouseEvent(clickAt[0] + 15, clickAt[1] + 15));
        map.fire('mousemove', makeMouseEvent(clickAt[0] + 30, clickAt[1] + 30, { which: 1 }));
        map.fire('mouseup', makeMouseEvent(clickAt[0] + 30, clickAt[1] + 30));
        var afterMove = Draw.get(ids[0]);
        st.deepEquals(getGeoJSON('polygon').geometry, afterMove.geometry, 'should be the same after the drag');
        cleanUp(() => st.end());
      });
    });
  });

  t.test('direct_select - fire one update when dragging mouse leaves container and button is released outside', st => {
    var ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });

    var startPosition = getGeoJSON('polygon').geometry.coordinates[0][1];
    afterNextRender(() => {
      click(map, makeMouseEvent(startPosition[0], startPosition[1]));
      afterNextRender(() => {
        map.fire.reset();
        map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
        map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { which: 1 }));
        mapContainer.dispatchEvent(createSyntheticEvent('mouseout'));
        map.fire('mousemove', makeMouseEvent(startPosition[0] + 30, startPosition[1] + 30));
        map.fire('mouseup', makeMouseEvent(startPosition[0] + 30, startPosition[1] + 30));

        var afterMove = Draw.get(ids[0]);
        var args = getFireArgs().filter(arg => arg[0] === 'draw.update');
        st.equal(args.length, 1, 'draw.update called once');
        st.equal(afterMove.geometry.coordinates[0][1][0], startPosition[0] + 15, 'point lng moved only the first amount');
        st.equal(afterMove.geometry.coordinates[0][1][1], startPosition[1] + 15, 'point lat moved only the first amount');

        cleanUp(() => st.end());
      });
    });
  });

  t.test('direct_select - fire two updates when dragging mouse leaves container then returns and button is released inside', st => {
    var ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });

    var startPosition = getGeoJSON('polygon').geometry.coordinates[0][1];
    afterNextRender(() => {
      click(map, makeMouseEvent(startPosition[0], startPosition[1]));
      afterNextRender(() => {
        map.fire.reset();
        map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
        map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { which: 1 }));
        mapContainer.dispatchEvent(createSyntheticEvent('mouseout'));
        map.fire('mousemove', makeMouseEvent(startPosition[0] + 30, startPosition[1] + 30, { which: 1 }));
        map.fire('mouseup', makeMouseEvent(startPosition[0] + 30, startPosition[1] + 30));

        var afterMove = Draw.get(ids[0]);
        var args = getFireArgs().filter(arg => arg[0] === 'draw.update');
        st.equal(args.length, 2, 'draw.update called twice');
        st.equal(afterMove.geometry.coordinates[0][1][0], startPosition[0] + 30, 'point lng moved to the mouseup location');
        st.equal(afterMove.geometry.coordinates[0][1][1], startPosition[1] + 30, 'point lat moved to the mouseup location');

        cleanUp(() => st.end());
      });
    });
  });

  document.body.removeChild(mapContainer);
  t.end();
});
