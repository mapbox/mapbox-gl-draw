/* eslint no-shadow:[0] */
import test from 'node:test';
import assert from 'node:assert/strict';
import createSyntheticEvent from 'synthetic-dom-events';
import {spy} from 'sinon';

import MapboxDraw from '../index.js';
import {setupAfterNextRender} from './utils/after_next_render.js';
import makeMouseEvent from './utils/make_mouse_event.js';
import mouseClick from './utils/mouse_click.js';
import makeTouchEvent from './utils/make_touch_event.js';
import getGeoJSON from './utils/get_geojson.js';
import createMap from './utils/create_map.js';
import createMockDrawModeContext from './utils/create_mock_draw_mode_context.js';
import { TAP_INTERVAL, TAP_TOLERANCE } from '../src/lib/is_tap.js';

test('simple_select', async (t) => {
  const context = createMockDrawModeContext();
  const mapContainer = document.createElement('div');
  document.body.appendChild(mapContainer);
  const map = createMap({ container: mapContainer });

  const Draw = new MapboxDraw();
  map.addControl(Draw);

  spy(map, 'fire');
  spy(map.doubleClickZoom, 'enable');
  spy(map.doubleClickZoom, 'disable');
  spy(map.dragPan, 'enable');
  spy(map.dragPan, 'disable');

  const afterNextRender = setupAfterNextRender(map);

  const cleanUp = function() {
    Draw.deleteAll();
    map.fire.resetHistory();
  };

  const getFireArgs = function() {
    const args = [];
    for (let i = 0; i < map.fire.callCount; i++) {
      args.push(map.fire.getCall(i).args);
    }
    return args;
  };

  t.test('simple_select - init map for tests', () => {
    const done = function() {
      map.off('load', done);
    };

    if (map.loaded()) {
      done();
    } else {
      map.on('load', done);
    }
  });


  await t.test('simple_select - box select', async () => {
    Draw.add(getGeoJSON('negativePoint'));
    const id = Draw.add(getGeoJSON('point'))[0];
    map.fire.resetHistory();

    await afterNextRender();
    map.dragPan.enable.resetHistory();
    map.dragPan.disable.resetHistory();
    map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
    assert.equal(map.dragPan.disable.callCount, 1, 'disable dragPan');
    map.fire('mousemove', makeMouseEvent(15, 15, {
      shiftKey: true,
      buttons: 1
    }));
    await afterNextRender();
    assert.equal(map.getContainer().className.indexOf('mouse-add') > -1, true, 'mouse-add class has been set');
    map.fire('mouseup', makeMouseEvent(15, 15, { shiftKey: true }));

    await afterNextRender();
    assert.equal(map.getContainer().className.indexOf('mouse-move') > -1, true, 'mouse-move class has been set');
    const fireArgs = getFireArgs();
    const args = fireArgs.filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 1, 'should have one and only one selectionchange event');
    if (args.length > 0) {
      assert.equal(args[0][1].features.length, 1, 'should have one feature selected');
      assert.equal(args[0][1].features[0].id, id, 'should be the feature we expect to be selected');
    }

    const actionableArgs = fireArgs.filter(arg => arg[0] === 'draw.actionable');
    assert.ok(actionableArgs.length > 0, 'should have fired an actionable event');
    if (actionableArgs.length > 0) {
      const actionable = actionableArgs[actionableArgs.length - 1][1];
      assert.equal(actionable.actions.combineFeatures, false, 'should fire correct combine actionable');
      assert.equal(actionable.actions.uncombineFeatures, false, 'should fire correct uncombine actionable');
      assert.equal(actionable.actions.trash, true, 'should fire correct trash actionable');
    }

    cleanUp();
  });

  await t.test('simple_select - box select many features', async () => {
    const features = [];
    for (let i = 0; i < 5; i++) {
      features.push(getGeoJSON('point'));
    }
    const ids = Draw.add({
      type: 'FeatureCollection',
      features
    });
    map.fire.resetHistory();

    await afterNextRender();
    map.dragPan.enable.resetHistory();
    map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
    map.fire('mousemove', makeMouseEvent(15, 15, {
      shiftKey: true,
      buttons: 1
    }));
    map.fire('mouseup', makeMouseEvent(15, 15, { shiftKey: true }));

    await afterNextRender();
    const fireArgs = getFireArgs();
    const args = fireArgs.filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 1, 'should have one and only one select event');
    if (args.length > 0) {
      assert.equal(args[0][1].features.length, ids.length, 'should have all features selected');
    }

    const actionableArgs = fireArgs.filter(arg => arg[0] === 'draw.actionable');
    assert.ok(actionableArgs.length > 0, 'should have fired an actionable event');
    if (actionableArgs.length > 0) {
      const actionable = actionableArgs[actionableArgs.length - 1][1];
      assert.equal(actionable.actions.combineFeatures, true, 'should fire correct combine actionable');
      assert.equal(actionable.actions.uncombineFeatures, false, 'should fire correct uncombine actionable');
      assert.equal(actionable.actions.trash, true, 'should fire correct trash actionable');
    }

    cleanUp();
  });

  await t.test('simple_select - box select over no points', async () => {
    Draw.add(getGeoJSON('point'));
    map.fire.resetHistory();

    await afterNextRender();
    map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
    map.fire('mousemove', makeMouseEvent(-15, -15, {
      shiftKey: true,
      buttons: 1
    }));
    map.fire('mouseup', makeMouseEvent(-15, -15, { shiftKey: true }));

    await afterNextRender();
    assert.equal(getFireArgs().filter(arg => arg[0] === 'draw.selectionchange').length, 0, 'there should be no draw.selectionchange event');
    cleanUp();
  });

  await t.test('simple_select - box select then mousemove', async () => {
    Draw.add(getGeoJSON('point'));
    map.fire.resetHistory();

    await afterNextRender();
    map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
    map.fire('mousemove', makeMouseEvent(15, 15, { shiftKey: true }));
    // This mousemove (not a drag) cancels the box select
    map.fire('mousemove', makeMouseEvent(15, 15));
    map.fire('mouseup', makeMouseEvent(15, 15, { shiftKey: true }));

    await afterNextRender();
    assert.equal(getFireArgs().filter(arg => arg[0] === 'draw.selectionchange').length, 0, 'there should be no draw.selectionchange event');
    cleanUp();
  });

  await t.test('simple_select - deselect', async () => {
    const id = Draw.add(getGeoJSON('point'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });

    await afterNextRender();
    map.fire.resetHistory();
    map.fire('mousedown', makeMouseEvent(15, 15));
    map.fire('mouseup', makeMouseEvent(15, 15));

    await afterNextRender();
    const args = getFireArgs().filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 1, 'should have one and only one selectionchange event');
    if (args.length > 0) {
      assert.equal(args[0][1].features.length, 0, 'should have no features selected');
    }

    cleanUp();
  });

  await t.test('simple_select - click on a deselected feature', async () => {
    const id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select');

    await afterNextRender();
    map.fire.resetHistory();
    map.doubleClickZoom.disable.resetHistory();
    map.fire('mousedown', makeMouseEvent(50, 30));
    map.fire('mouseup', makeMouseEvent(50, 30));

    await afterNextRender();
    assert.equal(map.doubleClickZoom.disable.callCount, 1, 'disable doubleClickZoom');
    let args = getFireArgs();
    args = args.filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 1, 'should have one and only one selectionchange event');
    if (args.length > 0) {
      assert.equal(args[0][1].features.length, 1, 'should have only one feature selected');
      assert.equal(args[0][1].features[0].id, id, 'should be the feature we expect to be selected');
    }
    cleanUp();
  });

  await t.test('simple_select - tap on a deselected feature', async () => {
    const id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select');

    await afterNextRender();
    map.fire.resetHistory();
    map.doubleClickZoom.disable.resetHistory();
    map.fire('touchstart', makeTouchEvent(50, 30));
    map.fire('touchend', makeTouchEvent(50, 30));

    await afterNextRender();
    let args = getFireArgs();
    args = args.filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 1, 'should have one and only one selectionchange event');
    if (args.length > 0) {
      assert.equal(args[0][1].features.length, 1, 'should have only one feature selected');
      assert.equal(args[0][1].features[0].id, id, 'should be the feature we expect to be selected');
    }
    cleanUp();
  });

  await t.test('simple_select - click on a selected feature with shift down', async () => {
    const id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });

    await afterNextRender();
    map.fire.resetHistory();
    map.doubleClickZoom.disable.resetHistory();
    map.fire('mousedown', makeMouseEvent(50, 30, { shiftKey: true }));
    map.fire('mouseup', makeMouseEvent(50, 30, { shiftKey: true }));

    await afterNextRender();
    assert.equal(map.doubleClickZoom.disable.callCount, 1, 'disable doubleClickZoom');
    assert.equal(map.getContainer().className.indexOf('mouse-pointer') > -1, true, 'mouse-pointer class has been set');
    let args = getFireArgs();
    args = args.filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 1, 'should have one and only one selectionchange event');
    if (args.length > 0) {
      assert.equal(args[0][1].features.length, 0, 'should have no features selected');
    }

    cleanUp();
  });

  await t.test('simple_select - delete selected features', async () => {
    const id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });
    map.fire.resetHistory();
    Draw.trash();
    await afterNextRender();
    let args = getFireArgs();
    args = args.filter(arg => arg[0] === 'draw.delete');
    assert.equal(args.length, 1, 'should have one and only one draw.delete event');
    assert.equal(args[0][1].features.length, 1, 'should delete only one feature');
    assert.equal(args[0][1].features[0].id, id, 'should delete the feature we expect it to delete');

    const selectedFeatures = Draw.getSelectedIds();
    assert.equal(selectedFeatures.length, 0, 'nothing should be selected anymore');
    cleanUp();
  });

  await t.test('simple_select - click on a selected feature with shift up to enter direct_select', async () => {
    Draw.deleteAll();
    const id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });

    await afterNextRender();
    map.doubleClickZoom.enable.resetHistory();
    map.fire.resetHistory();
    map.doubleClickZoom.disable.resetHistory();
    map.fire('mousedown', makeMouseEvent(50, 30, false));
    map.fire('mouseup', makeMouseEvent(50, 30, false));

    await afterNextRender();
    assert.equal(map.doubleClickZoom.disable.callCount, 2, 'disable doubleClickZoom. Once for click, once for direct_select');
    assert.equal(map.doubleClickZoom.enable.callCount, 1, 'double click zoom has been enabled');
    assert.equal(map.getContainer().className.indexOf('mouse-move') > -1, true, 'mouse-move class has been set');
    let args = getFireArgs();
    args = args.filter(arg => arg[0] === 'draw.modechange');
    assert.equal(args.length, 1, 'should have one and only one modechange event');
    if (args.length > 0) {
      assert.equal(args[0][1].mode, 'direct_select', 'should change to direct select');
    }
    cleanUp();
  });

  await t.test('simple_select - click on a vertex to enter direct_select', async () => {
    const id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });

    const clickPosition = getGeoJSON('polygon').geometry.coordinates[0][0];

    await afterNextRender();
    map.doubleClickZoom.enable.resetHistory();
    map.fire.resetHistory();
    map.fire('mousedown', makeMouseEvent(clickPosition[0], clickPosition[1]));
    map.fire('mouseup', makeMouseEvent(clickPosition[0], clickPosition[1]));

    await afterNextRender();
    assert.equal(map.doubleClickZoom.enable.callCount, 1, 'double click zoom has been enabled');
    let args = getFireArgs();
    args = args.filter(arg => arg[0] === 'draw.modechange');
    assert.equal(args.length, 1, 'should have one and only one modechange event');
    if (args.length > 0) {
      assert.equal(args[0][1].mode, 'direct_select', 'should change to direct select');
    }
    cleanUp();
  });

  await t.test('simple_select - tap on a vertex to enter direct_select', async () => {
    const id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });

    const tapPosition = getGeoJSON('polygon').geometry.coordinates[0][0];

    await afterNextRender();
    map.doubleClickZoom.enable.resetHistory();
    map.fire.resetHistory();
    map.fire('touchstart', makeTouchEvent(tapPosition[0], tapPosition[1]));
    map.fire('touchend', makeTouchEvent(tapPosition[0], tapPosition[1]));

    await afterNextRender();
    let args = getFireArgs();
    args = args.filter(arg => arg[0] === 'draw.modechange');
    assert.equal(args.length, 1, 'should have one and only one modechange event');
    if (args.length > 0) {
      assert.equal(args[0][1].mode, 'direct_select', 'should change to direct select');
    }
    cleanUp();
  });

  await t.test('simple_select - tap dragging fires an update event', async () => {
    const point = getGeoJSON('point');
    const pointId = Draw.add(point)[0];
    const translatePosition = (point, d) => [point[0] + d, point[1] + d];

    const startPosition = point.geometry.coordinates;
    const endPosition = translatePosition(startPosition, 25);

    Draw.changeMode('simple_select', {
      featureIds: [pointId]
    });

    await afterNextRender();
    map.fire.resetHistory();
    map.fire('touchstart', makeTouchEvent(...startPosition));
    map.fire('touchmove', makeTouchEvent(...translatePosition(startPosition, 15)));
    map.fire('touchmove', makeTouchEvent(...endPosition));
    map.fire('touchend', makeTouchEvent(...endPosition));

    const movedPoint = Draw.get(pointId);
    const args = getFireArgs().filter(arg => arg[0] === 'draw.update');
    assert.equal(args.length, 1, 'draw.update called once');
    assert.equal(movedPoint.geometry.coordinates[0], endPosition[0], 'point lng moved to touchend location');
    assert.equal(movedPoint.geometry.coordinates[1], endPosition[1], 'point lat moved to touchend location');
  });

  await t.test('simple_select - click on a deselected feature with shift down while having another feature selected', async () => {
    const pointId = Draw.add(getGeoJSON('point'))[0];
    const id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });

    await afterNextRender();
    map.fire.resetHistory();
    map.fire('mousedown', makeMouseEvent(50, 30, { shiftKey: true }));
    map.fire('mouseup', makeMouseEvent(50, 30, { shiftKey: true }));

    await afterNextRender();
    assert.equal(map.getContainer().className.indexOf('mouse-move') > -1, true, 'mouse-move class has been set');
    assert.equal(Draw.getSelectedIds().indexOf(pointId) !== -1, true, 'point is still selected');
    assert.equal(Draw.getSelectedIds().indexOf(id) !== -1, true, 'polygon is now selected');
    let args = getFireArgs();
    args = args.filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 1, 'should have one and only one selectionchange event');
    if (args.length > 0) {
      assert.equal(args[0][1].features.length, 2, 'should have two features selected');
      assert.equal(args[0][1].features[0].id, pointId, 'selection includes point');
      assert.equal(args[0][1].features[1].id, id, 'selection includes polygon');
    }
    cleanUp();
  });

  await t.test('simple_select - click on a deselected feature with shift up, while having another feature selected', async () => {
    const pointId = Draw.add(getGeoJSON('point'))[0];
    const id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });

    await afterNextRender();
    map.fire.resetHistory();
    map.fire('mousedown', makeMouseEvent(50, 30, false));
    map.fire('mouseup', makeMouseEvent(50, 30, false));

    await afterNextRender();
    assert.equal(map.getContainer().className.indexOf('mouse-move') > -1, true, 'mouse-move class has been set');
    assert.equal(Draw.getSelectedIds().indexOf(pointId) === -1, true, 'point is no longer selected');
    assert.equal(Draw.getSelectedIds().indexOf(id) !== -1, true, 'polygon is now selected');
    let args = getFireArgs();
    args = args.filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 1, 'should have one and only one selectionchange event');
    if (args.length > 0) {
      assert.equal(args[0][1].features.length, 1, 'should have only one feature selected');
      assert.equal(args[0][1].features[0].id, id, 'should be the feature we expect to be selected');
    }
    cleanUp();
  });

  await t.test('simple_select - drag every feature type', async () => {
    const pointId = Draw.add(getGeoJSON('point'))[0];
    const multiPointId = Draw.add(getGeoJSON('multiPoint'))[0];
    const lineStringId = Draw.add(getGeoJSON('line'))[0];
    const multiLineStringId = Draw.add(getGeoJSON('multiLineString'))[0];
    const polygonId = Draw.add(getGeoJSON('polygon'))[0];
    const multiPolygonId = Draw.add(getGeoJSON('multiPolygon'))[0];

    const countPositions = function(feature) {
      return feature.geometry.coordinates.join(',').split(',').length;
    };

    const startPosition = getGeoJSON('point').geometry.coordinates;
    Draw.changeMode('simple_select', {
      featureIds: [pointId, multiPointId, lineStringId, multiLineStringId, polygonId, multiPolygonId]
    });
    await afterNextRender();
    map.fire.resetHistory();
    map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
    map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { buttons: 1 }));
    map.fire('mousemove', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25, { buttons: 1 }));
    map.fire('mouseup', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));

    const movedPoint = Draw.get(pointId);
    assert.equal(movedPoint.geometry.coordinates[0], startPosition[0] + 25, 'point lng moved');
    assert.equal(movedPoint.geometry.coordinates[1], startPosition[1] + 25, 'point lat moved');
    assert.equal(countPositions(movedPoint), countPositions(getGeoJSON('point')), 'point has same number of postions');

    const movedMultiPoint = Draw.get(multiPointId);
    assert.equal(movedMultiPoint.geometry.coordinates[0][0], getGeoJSON('multiPoint').geometry.coordinates[0][0] + 25, 'multipoint lng moved');
    assert.equal(movedMultiPoint.geometry.coordinates[0][1], getGeoJSON('multiPoint').geometry.coordinates[0][1] + 25, 'multipoint lat moved');
    assert.equal(countPositions(movedMultiPoint), countPositions(getGeoJSON('multiPoint')), 'multiPoint has same number of postions');

    const movedLineString = Draw.get(lineStringId);
    assert.equal(movedLineString.geometry.coordinates[0][0], getGeoJSON('line').geometry.coordinates[0][0] + 25, 'line lng moved');
    assert.equal(movedLineString.geometry.coordinates[0][1], getGeoJSON('line').geometry.coordinates[0][1] + 25, 'line lat moved');
    assert.equal(countPositions(movedLineString), countPositions(getGeoJSON('line')), 'line has same number of postions');

    const movedMultiLineString = Draw.get(multiLineStringId);
    assert.equal(movedMultiLineString.geometry.coordinates[0][0][0], getGeoJSON('multiLineString').geometry.coordinates[0][0][0] + 25, 'multiLineString lng moved');
    assert.equal(movedMultiLineString.geometry.coordinates[0][0][1], getGeoJSON('multiLineString').geometry.coordinates[0][0][1] + 25, 'multiLineString lat moved');
    assert.equal(countPositions(movedMultiLineString), countPositions(getGeoJSON('multiLineString')), 'multiLineString has same number of postions');

    const movedPolygon = Draw.get(polygonId);
    assert.equal(movedPolygon.geometry.coordinates[0][0][0], getGeoJSON('polygon').geometry.coordinates[0][0][0] + 25, 'polygon lng moved');
    assert.equal(movedPolygon.geometry.coordinates[0][0][1], getGeoJSON('polygon').geometry.coordinates[0][0][1] + 25, 'polygon lat moved');
    assert.equal(countPositions(movedPolygon), countPositions(getGeoJSON('polygon')), 'polygon has same number of postions');

    const movedMultiPolygon = Draw.get(multiPolygonId);
    assert.equal(movedMultiPolygon.geometry.coordinates[0][0][0][0], getGeoJSON('multiPolygon').geometry.coordinates[0][0][0][0] + 25, 'multiPolygon lng moved');
    assert.equal(movedMultiPolygon.geometry.coordinates[0][0][0][1], getGeoJSON('multiPolygon').geometry.coordinates[0][0][0][1] + 25, 'multiPolygon lat moved');
    assert.equal(countPositions(movedMultiPolygon), countPositions(getGeoJSON('multiPolygon')), 'multiPolygon has same number of postions');

    cleanUp();
  });

  await t.test('simple_select - interrupt drag move with mousemove', async () => {
    const pointId = Draw.add(getGeoJSON('point'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });
    const startPosition = getGeoJSON('point').geometry.coordinates;
    await afterNextRender();
    map.fire.resetHistory();
    map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
    // Dragging
    map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { buttons: 1 }));
    // Not dragging
    map.fire('mousemove', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));
    map.fire('mouseup', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));

    const movedPoint = Draw.get(pointId);
    assert.equal(movedPoint.geometry.coordinates[0], startPosition[0] + 15, 'point lng moved only the first amount');
    assert.equal(movedPoint.geometry.coordinates[1], startPosition[1] + 15, 'point lat moved only the first amount');

    cleanUp();
  });

  await t.test('simple_select - fire one update when dragging mouse leaves container and button is released outside', async () => {
    const pointId = Draw.add(getGeoJSON('point'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });
    const startPosition = getGeoJSON('point').geometry.coordinates;
    await afterNextRender();
    map.fire.resetHistory();
    map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
    map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { buttons: 1 }));
    mapContainer.dispatchEvent(createSyntheticEvent('mouseout'));
    map.fire('mousemove', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));
    map.fire('mouseup', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));

    const movedPoint = Draw.get(pointId);
    const args = getFireArgs().filter(arg => arg[0] === 'draw.update');
    assert.equal(args.length, 1, 'draw.update called once');
    assert.equal(movedPoint.geometry.coordinates[0], startPosition[0] + 15, 'point lng moved only the first amount');
    assert.equal(movedPoint.geometry.coordinates[1], startPosition[1] + 15, 'point lat moved only the first amount');

    cleanUp();
  });

  await t.test('simple_select - fire two update when dragging mouse leaves container then returns and button is released inside', async () => {
    const pointId = Draw.add(getGeoJSON('point'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });
    const startPosition = getGeoJSON('point').geometry.coordinates;
    await afterNextRender();
    map.fire.resetHistory();
    map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
    map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { buttons: 1 }));
    mapContainer.dispatchEvent(createSyntheticEvent('mouseout'));
    map.fire('mousemove', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25, { buttons: 1 }));
    map.fire('mouseup', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));

    const movedPoint = Draw.get(pointId);
    const args = getFireArgs().filter(arg => arg[0] === 'draw.update');
    assert.equal(args.length, 2, 'draw.update called twice');
    assert.equal(movedPoint.geometry.coordinates[0], startPosition[0] + 25, 'point lng moved to the mouseup location');
    assert.equal(movedPoint.geometry.coordinates[1], startPosition[1] + 25, 'point lat moved to the mouseup location');
  });

  t.test('simple_select - on closing invalid line', () => {
    Draw.changeMode('draw_line_string');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(1, 1));
    assert.equal(Draw.getMode(), 'simple_select', 'should be in simple_select mode');
    assert.equal(Draw.getSelected().features.length, 0, 'should not get any selected features');
    assert.equal(context.store._emitSelectionChange, undefined, 'should not emit selection change');
    cleanUp();
  });

  t.test('simple_select - on closing invalid polygon', () => {
    Draw.changeMode('draw_polygon');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(16, 16));
    mouseClick(map, makeMouseEvent(16, 16));
    assert.equal(Draw.getMode(), 'simple_select', 'should be in simple_select mode');
    assert.equal(Draw.getSelected().features.length, 0, 'should not get any selected features');
    assert.equal(context.store._emitSelectionChange, undefined, 'should not emit selection change');
    cleanUp();
  });

  await t.test('simple_select - fire one update after moving point with touch', async () => {
    const pointId = Draw.add(getGeoJSON('point'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });
    const startPosition = getGeoJSON('point').geometry.coordinates;
    const endPosition = [startPosition[0] + TAP_TOLERANCE, startPosition[1] + TAP_TOLERANCE];
    await afterNextRender();
    map.fire.resetHistory();
    map.doubleClickZoom.disable.resetHistory();
    map.fire('touchstart', makeTouchEvent(startPosition[0], startPosition[1]));

    await new Promise(resolve => setTimeout(resolve, TAP_INTERVAL));

    map.fire('touchmove', makeTouchEvent(endPosition[0], endPosition[1]));
    map.fire('touchend', makeTouchEvent(endPosition[0], endPosition[1]));

    const movedPoint = Draw.get(pointId);
    const args = getFireArgs().filter(arg => arg[0] === 'draw.update');
    assert.equal(args.length, 1, 'draw.update called once');
    assert.equal(movedPoint.geometry.coordinates[0], endPosition[0], 'point lng moved to the last touchmove position');
    assert.equal(movedPoint.geometry.coordinates[1], endPosition[1], 'point lat moved the last touchmove position');
    cleanUp();
  });

  document.body.removeChild(mapContainer);
});
