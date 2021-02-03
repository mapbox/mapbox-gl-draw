/* eslint no-shadow:[0] */
import turfCentroid from '@turf/centroid';
import test from 'tape';
import MapboxDraw from '../index';
import click from './utils/mouse_click';
import tap from './utils/touch_tap';
import getGeoJSON from './utils/get_geojson';
import createMap from './utils/create_map';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import setupAfterNextRender from './utils/after_next_render';
import makeMouseEvent from './utils/make_mouse_event';
import makeTouchEvent from './utils/make_touch_event';
import * as Constants from '../src/constants';
import createSyntheticEvent from 'synthetic-dom-events';

test('direct_select', (t) => {

  const mapContainer = document.createElement('div');
  document.body.appendChild(mapContainer);
  const map = createMap({ container: mapContainer });

  const Draw = new MapboxDraw();
  map.addControl(Draw);

  spy(map, 'fire');

  const afterNextRender = setupAfterNextRender(map);

  const cleanUp = function(cb) {
    Draw.deleteAll();
    map.fire.resetHistory();
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

  t.test('direct_select - init map for tests', (st) => {
    const done = function() {
      map.off('load', done);
      st.end();
    };
    if (map.loaded()) {
      done();
    } else {
      map.on('load', done);
    }
  });

  t.test('direct_select - should fire correct actionable when no vertices selected', (st) => {
    const ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: ids
    });
    afterNextRender(() => {
      Draw.changeMode(Constants.modes.DIRECT_SELECT, {
        featureId: ids[0]
      });
      afterNextRender(() => {
        const actionableArgs = getFireArgs().filter(arg => arg[0] === 'draw.actionable');
        st.ok(actionableArgs.length > 0, 'should have fired an actionable event');
        if (actionableArgs.length > 0) {
          const actionable = actionableArgs[actionableArgs.length - 1][1];
          st.equal(actionable.actions.combineFeatures, false, 'should fire correct combine actionable');
          st.equal(actionable.actions.uncombineFeatures, false, 'should fire correct uncombine actionable');
          st.equal(actionable.actions.trash, false, 'should fire correct trash actionable');
        }
        cleanUp(() => st.end());
      });
    });
  });

  t.test('direct_select - should fire correct actionable when a vertex is selected by clicking', (st) => {
    const ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });
    const clickAt = getGeoJSON('polygon').geometry.coordinates[0][0];
    afterNextRender(() => {
      click(map, makeMouseEvent(clickAt[0], clickAt[1]));
      afterNextRender(() => {
        const actionableArgs = getFireArgs().filter(arg => arg[0] === 'draw.actionable');
        st.ok(actionableArgs.length > 0, 'should have fired an actionable event');
        if (actionableArgs.length > 0) {
          const actionable = actionableArgs[actionableArgs.length - 1][1];
          st.equal(actionable.actions.combineFeatures, false, 'should fire correct combine actionable');
          st.equal(actionable.actions.uncombineFeatures, false, 'should fire correct uncombine actionable');
          st.equal(actionable.actions.trash, true, 'should fire correct trash actionable');
        }
        cleanUp(() => st.end());
      });
    });
  });

  t.test('direct_select - should fire correct actionable when a vertex is selected by tapping', (st) => {
    const ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });
    const tapAt = getGeoJSON('polygon').geometry.coordinates[0][0];
    afterNextRender(() => {
      tap(map, makeTouchEvent(tapAt[0], tapAt[1]));
      afterNextRender(() => {
        const actionableArgs = getFireArgs().filter(arg => arg[0] === 'draw.actionable');
        st.ok(actionableArgs.length > 0, 'should have fired an actionable event');
        if (actionableArgs.length > 0) {
          const actionable = actionableArgs[actionableArgs.length - 1][1];
          st.equal(actionable.actions.combineFeatures, false, 'should fire correct combine actionable');
          st.equal(actionable.actions.uncombineFeatures, false, 'should fire correct uncombine actionable');
          st.equal(actionable.actions.trash, true, 'should fire correct trash actionable');
        }
        cleanUp(() => st.end());
      });
    });
  });

  t.test('direct_select - trashing vertices should delete the correct ones', (st) => {
    const longLine = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[0, 0], [10, 0], [20, 0], [30, 0], [40, 0], [50, 0], [60, 0], [70, 0], [80, 0], [80, 10], [70, 10], [60, 10], [50, 10]]
      }
    };
    const ids = Draw.add(longLine);
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });
    afterNextRender(() => {
      // select multiple nodes at indices 9, 10, 11
      click(map, makeMouseEvent(70, 10, { shiftKey: true }));
      click(map, makeMouseEvent(80, 10, { shiftKey: true }));
      click(map, makeMouseEvent(60, 10, { shiftKey: true }));
      afterNextRender(() => {
        Draw.trash();
        const afterTrash = Draw.get(ids[0]);
        st.deepEqual(afterTrash.geometry.coordinates, [[0, 0], [10, 0], [20, 0], [30, 0], [40, 0], [50, 0], [60, 0], [70, 0], [80, 0], [50, 10]]);
        cleanUp(() => st.end());
      });
    });
  });

  t.test('direct_select - a click on a vertex and than dragging the map shouldn\'t drag the vertex', (st) => {
    const ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });

    const clickAt = getGeoJSON('polygon').geometry.coordinates[0][0];
    afterNextRender(() => {
      click(map, makeMouseEvent(clickAt[0], clickAt[1]));
      afterNextRender(() => {
        map.fire('mousedown', makeMouseEvent(clickAt[0] + 15, clickAt[1] + 15));
        map.fire('mousemove', makeMouseEvent(clickAt[0] + 30, clickAt[1] + 30, { buttons: 1 }));
        map.fire('mouseup', makeMouseEvent(clickAt[0] + 30, clickAt[1] + 30));
        const afterMove = Draw.get(ids[0]);
        st.deepEquals(getGeoJSON('polygon').geometry, afterMove.geometry, 'should be the same after the drag');
        cleanUp(() => st.end());
      });
    });
  });

  t.test('direct_select - fire one update when dragging mouse leaves container and button is released outside', (st) => {
    const ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });

    const startPosition = getGeoJSON('polygon').geometry.coordinates[0][1];
    afterNextRender(() => {
      click(map, makeMouseEvent(startPosition[0], startPosition[1]));
      afterNextRender(() => {
        map.fire.resetHistory();
        map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
        map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { buttons: 1 }));
        mapContainer.dispatchEvent(createSyntheticEvent('mouseout'));
        map.fire('mousemove', makeMouseEvent(startPosition[0] + 30, startPosition[1] + 30), { buttons: 1 });
        map.fire('mouseup', makeMouseEvent(startPosition[0] + 30, startPosition[1] + 30));

        const afterMove = Draw.get(ids[0]);
        const args = getFireArgs().filter(arg => arg[0] === 'draw.update');
        st.equal(args.length, 1, 'draw.update called once');
        st.equal(afterMove.geometry.coordinates[0][1][0], startPosition[0] + 15, 'point lng moved only the first amount');
        st.equal(afterMove.geometry.coordinates[0][1][1], startPosition[1] + 15, 'point lat moved only the first amount');

        cleanUp(() => st.end());
      });
    });
  });

  t.test('direct_select - fire two updates when dragging mouse leaves container then returns and button is released inside', (st) => {
    const ids = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: ids[0]
    });

    const startPosition = getGeoJSON('polygon').geometry.coordinates[0][1];
    afterNextRender(() => {
      click(map, makeMouseEvent(startPosition[0], startPosition[1]));
      afterNextRender(() => {
        map.fire.resetHistory();
        map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
        map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { buttons: 1 }));
        mapContainer.dispatchEvent(createSyntheticEvent('mouseout'));
        map.fire('mousemove', makeMouseEvent(startPosition[0] + 30, startPosition[1] + 30, { buttons: 1 }));
        map.fire('mouseup', makeMouseEvent(startPosition[0] + 30, startPosition[1] + 30));

        const afterMove = Draw.get(ids[0]);
        const args = getFireArgs().filter(arg => arg[0] === 'draw.update');
        st.equal(args.length, 2, 'draw.update called twice');
        st.equal(afterMove.geometry.coordinates[0][1][0], startPosition[0] + 30, 'point lng moved to the mouseup location');
        st.equal(afterMove.geometry.coordinates[0][1][1], startPosition[1] + 30, 'point lat moved to the mouseup location');

        cleanUp(() => st.end());
      });
    });
  });

  t.test('direct_select - drag feature if no vertices are selected', (st) => {
    const [polygonId] = Draw.add(getGeoJSON('polygon'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: polygonId
    });

    const startPosition = getGeoJSON('polygon').geometry.coordinates[0][1];
    const centroid = turfCentroid(getGeoJSON('polygon')).geometry.coordinates;
    afterNextRender(() => {
      map.fire.resetHistory();
      click(map, makeMouseEvent(centroid[0], centroid[1]));
      map.fire('mousedown', makeMouseEvent(centroid[0], centroid[1]));
      map.fire('mousemove', makeMouseEvent(centroid[0] + 15, centroid[1] + 15, { buttons: 1 }));
      map.fire('mouseup', makeMouseEvent(centroid[0] + 15, centroid[1] + 15));

      const afterMove = Draw.get(polygonId);
      const args = getFireArgs().filter(arg => arg[0] === 'draw.update');
      st.equal(args.length, 1, 'draw.update called once');
      st.equal(afterMove.geometry.coordinates[0][1][0], startPosition[0] + 15, 'point lng moved to the mouseup location');
      st.equal(afterMove.geometry.coordinates[0][1][1], startPosition[1] + 15, 'point lat moved to the mouseup location');

      cleanUp(() => st.end());
    });
  });

  t.test('direct_select - dragging a selected vertex updates stored coordinates', (st) => {
    const [lineId] = Draw.add(getGeoJSON('line'));
    Draw.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: lineId
    });
    st.notOk(Draw.getSelectedPoints().features[0], 'no initial selection');

    const startPosition = getGeoJSON('line').geometry.coordinates[0];
    const endPosition = [startPosition[0] + 10, startPosition[1] + 10];
    afterNextRender(() => {
      map.fire.resetHistory();
      click(map, makeMouseEvent(startPosition[0], startPosition[1]));
      st.deepEqual(Draw.getSelectedPoints().features[0].geometry.coordinates, startPosition, 'click saves selection');

      map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
      map.fire('mousemove', makeMouseEvent(endPosition[0], endPosition[1], { buttons: 1 }));
      map.fire('mouseup', makeMouseEvent(endPosition[0], endPosition[1]));
      afterNextRender(() => {
        st.deepEqual(Draw.getSelectedPoints().features[0].geometry.coordinates, endPosition, 'selection is accurate after dragging');
        cleanUp(() => st.end());
      });
    });
  });

  document.body.removeChild(mapContainer);
  t.end();
});
