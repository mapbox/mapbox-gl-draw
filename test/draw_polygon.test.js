import test from 'node:test';
import assert from 'node:assert/strict';
import MapboxDraw from '../index.js';
import createMap from './utils/create_map.js';
import mouseClick from './utils/mouse_click.js';
import touchTap from './utils/touch_tap.js';
import makeMouseEvent from './utils/make_mouse_event.js';
import makeTouchEvent from './utils/make_touch_event.js';
import drawPolygonModeObject from '../src/modes/draw_polygon.js';
import Polygon from '../src/feature_types/polygon.js';
import createMockDrawModeContext from './utils/create_mock_draw_mode_context.js';
import createMockLifecycleContext from './utils/create_mock_lifecycle_context.js';
import {setupAfterNextRender} from './utils/after_next_render.js';
import objectToMode from '../src/modes/object_to_mode.js';
const drawPolygonMode = objectToMode(drawPolygonModeObject);

import {
  enterEvent,
  startPointEvent,
  startLineStringEvent,
  startPolygonEvent,
  escapeEvent
} from './utils/key_events.js';

test('draw_polygon mode initialization', () => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  assert.equal(context.store.add.callCount, 1, 'store.add called');

  const emptyPolygon = new Polygon(context, {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[]]
    }
  });
  // Strip ids for this comparison
  assert.deepEqual(Object.assign({}, context.store.add.getCall(0).args[0], { id: null }),
    Object.assign({}, emptyPolygon, { id: null }), 'with a new polygon');
});

test('draw_polygon start', async () => {
  const context = createMockDrawModeContext();
  const lifecycleContext = createMockLifecycleContext();
  const mode = drawPolygonMode(context);

  mode.start.call(lifecycleContext);
  assert.equal(context.store.clearSelected.callCount, 1, 'store.clearSelected called');
  assert.equal(context.ui.queueMapClasses.callCount, 1, 'ui.queueMapClasses called');
  assert.deepEqual(context.ui.queueMapClasses.getCall(0).args, [{ mouse: 'add' }],
    'ui.queueMapClasses received correct arguments');
  assert.equal(context.ui.setActiveButton.callCount, 1, 'ui.setActiveButton called');
  assert.deepEqual(context.ui.setActiveButton.getCall(0).args, ['polygon'],
    'ui.setActiveButton received correct arguments');

  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(context.map.doubleClickZoom.disable.callCount, 1);
});

test('draw_polygon stop with valid polygon', () => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  // Fake a valid polygon
  const testPolygon = context.store.get(context.store.getAllIds()[0]);
  testPolygon.isValid = () => true;

  mode.stop.call();
  assert.equal(context.ui.setActiveButton.callCount, 2, 'ui.setActiveButton called');
  assert.deepEqual(context.ui.setActiveButton.getCall(1).args, [undefined],
    'ui.setActiveButton received correct arguments');
  assert.equal(context.store.delete.callCount, 0, 'store.delete not called');
});

test('draw_polygon stop with invalid polygon', () => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  // Fake an invalid polygon
  const testPolygon = context.store.get(context.store.getAllIds()[0]);
  testPolygon.isValid = () => false;

  mode.stop.call();
  assert.equal(context.ui.setActiveButton.callCount, 2, 'ui.setActiveButton called');
  assert.deepEqual(context.ui.setActiveButton.getCall(1).args, [undefined],
    'ui.setActiveButton received correct arguments');
  assert.equal(context.store.delete.callCount, 1, 'store.delete called');
  assert.deepEqual(context.store.delete.getCall(0).args, [
    [testPolygon.id],
    { silent: true }
  ], 'store.delete received correct arguments');
});

test('draw_polygon render active polygon with no coordinates', () => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);
  const testPolygon = context.store.get(context.store.getAllIds()[0]);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: testPolygon.id
    },
    geometry: {
      type: 'Polygon',
      coordinates: []
    }
  };
  mode.render(geojson, x => memo.push(x));
  assert.equal(memo.length, 0, 'does not render');
});

test('draw_polygon render active polygon with 1 coordinate (and closer)', () => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);
  const testPolygon = context.store.get(context.store.getAllIds()[0]);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: testPolygon.id
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[10, 10], [10, 10]]]
    }
  };
  mode.render(geojson, x => memo.push(x));
  assert.equal(memo.length, 0, 'does not render');
});

test('draw_polygon render active polygon with 2 coordinates (and closer)', () => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);
  const testPolygon = context.store.get(context.store.getAllIds()[0]);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: testPolygon.id
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 10], [0, 0]]]
    }
  };
  mode.render(geojson, x => memo.push(x));
  assert.equal(memo.length, 2, 'does render');
  assert.deepEqual(memo[1], {
    type: 'Feature',
    properties: {
      id: testPolygon.id,
      active: 'true',
      meta: 'feature'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [0, 10]]
    }
  }, 'renders as a LineString with meta: feature, active: true');

});

test('draw_polygon render active polygon with 3 coordinates (and closer)', () => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);
  const testPolygon = context.store.get(context.store.getAllIds()[0]);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: testPolygon.id
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
    }
  };
  mode.render(geojson, x => memo.push(x));
  assert.equal(memo.length, 3, 'does render');
  assert.deepEqual(memo[0], {
    type: 'Feature',
    properties: {
      parent: testPolygon.id,
      meta: 'vertex',
      coord_path: '0.0',
      active: 'false'
    },
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  }, 'renders the start point point with meta: vertex');
  assert.deepEqual(memo[1], {
    type: 'Feature',
    properties: {
      parent: testPolygon.id,
      meta: 'vertex',
      coord_path: '0.2',
      active: 'false'
    },
    geometry: {
      type: 'Point',
      coordinates: [10, 10]
    }
  }, 'renders end point with meta: vertex');
  assert.deepEqual(memo[2], {
    type: 'Feature',
    properties: {
      id: testPolygon.id,
      active: 'true',
      meta: 'feature'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
    }
  }, 'renders as a polygon with meta: feature, active: true');

});

test('draw_polygon render inactive feature', () => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      meta: 'meh'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [0, 10]]
    }
  };
  mode.render(geojson, x => memo.push(x));
  assert.equal(memo.length, 1, 'does render');
  assert.deepEqual(memo[0], {
    type: 'Feature',
    properties: {
      active: 'false',
      meta: 'meh'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [0, 10]]
    }
  }, 'unaltered except active: false');

});

test('draw_polygon mouse interaction', async (t) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  await map.on('load');

  // The following sub-tests share state ...
  const afterNextRender = setupAfterNextRender(map);

  Draw.changeMode('draw_polygon');
  t.test('first click', () => {
    mouseClick(map, makeMouseEvent(10, 20));

    const { features } = Draw.getAll();
    assert.equal(features.length, 1, 'polygon created');
    const polygon = Draw.getAll().features[0];
    assert.equal(polygon.geometry.type, 'Polygon');

    assert.deepEqual(polygon.geometry.coordinates, [[[10, 20], [10, 20], [10, 20]]], 'starting coordinate added');
  });

  await t.test('move mouse', () => {
    map.fire('mousemove', makeMouseEvent(15, 23));
    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[10, 20], [15, 23], [10, 20]]], 'middle coordinate added');
  });

  await t.test('move mouse again', () => {
    map.fire('mousemove', makeMouseEvent(30, 33));
    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[10, 20], [30, 33], [10, 20]]], 'middle coordinate replaced');
  });

  await t.test('click to add another vertex', () => {
    mouseClick(map, makeMouseEvent(35, 35));
    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[10, 20], [35, 35], [35, 35], [10, 20]]], 'middle coordinate replaced');
  });

  t.test('add more points then click on the last vertex to finish', () => {
    mouseClick(map, makeMouseEvent(40, 40));
    mouseClick(map, makeMouseEvent(50, 50));
    mouseClick(map, makeMouseEvent(55, 55));
    mouseClick(map, makeMouseEvent(55, 55));
    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates,
      [[[10, 20], [35, 35], [40, 40], [50, 50], [55, 55], [10, 20]]],
      'all coordinates in place');

    mouseClick(map, makeMouseEvent(40, 40));
    assert.deepEqual(polygon.geometry.coordinates,
      [[[10, 20], [35, 35], [40, 40], [50, 50], [55, 55], [10, 20]]],
      'since we exited draw_polygon mode, another click does not add a coordinate');
  });

  await t.test('start a polygon but trash it before completion', () => {
    // Start a new polygon
    Draw.deleteAll();
    Draw.changeMode('draw_polygon');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(2, 2));
    mouseClick(map, makeMouseEvent(3, 3));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [2, 2], [3, 3], [3, 3], [1, 1]]]);

    Draw.trash();
    assert.equal(Draw.getAll().features.length, 0, 'no feature added');

    mouseClick(map, makeMouseEvent(1, 1));
    assert.equal(Draw.getAll().features.length, 0, 'no longer drawing');
  });

  await t.test('start a polygon but trash it with Escape before completion', () => {
    // Start a new polygon
    Draw.deleteAll();
    Draw.changeMode('draw_polygon');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(2, 2));
    mouseClick(map, makeMouseEvent(3, 3));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [2, 2], [3, 3], [3, 3], [1, 1]]]);

    container.dispatchEvent(escapeEvent);

    assert.equal(Draw.getAll().features.length, 0, 'no feature added');

    mouseClick(map, makeMouseEvent(1, 1));
    assert.equal(Draw.getAll().features.length, 0, 'no longer drawing');
  });

  // ZERO CLICK TESTS

  await t.test('start a polygon and end it with Enter', () => {
    // Start a new polygon
    Draw.deleteAll();
    Draw.changeMode('draw_polygon');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(2, 2));
    mouseClick(map, makeMouseEvent(3, 3));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [2, 2], [3, 3], [3, 3], [1, 1]]]);

    container.dispatchEvent(enterEvent);

    assert.equal(Draw.getAll().features.length, 1, 'the feature was added');
    assert.deepEqual(Draw.getAll().features[0].geometry.coordinates, [[[1, 1], [2, 2], [3, 3], [1, 1]]], 'the polygon is correct');

    mouseClick(map, makeMouseEvent(1, 1));
    assert.equal(Draw.getAll().features.length, 1, 'no longer drawing');
  });

  await t.test('start draw_polygon mode then changemode before a click', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.type, 'Polygon');

    Draw.changeMode('simple_select');
    assert.equal(Draw.getAll().features.length, 0, 'polygon is removed');
  });

  // ONE CLICK TESTS

  await t.test('start draw_polygon mode then enter after one click', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    map.fire('mousemove', makeMouseEvent(16, 16));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [1, 1]]], 'and has right coordinates');

    container.dispatchEvent(enterEvent);
    assert.equal(Draw.getAll().features.length, 0, 'polygon was removed');
  });

  await t.test('start draw_polygon mode then start a point after one click', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    map.fire('mousemove', makeMouseEvent(16, 16));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [1, 1]]], 'and has right coordinates');

    container.dispatchEvent(startPointEvent);
    assert.equal(Draw.get(polygon.id), undefined, 'polygon was removed');
  });

  await t.test('start draw_polygon mode then start a line_string after one click', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    map.fire('mousemove', makeMouseEvent(16, 16));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [1, 1]]], 'and has right coordinates');

    container.dispatchEvent(startLineStringEvent);
    assert.equal(Draw.get(polygon.id), undefined, 'polygon was removed');
  });

  await t.test('start draw_polygon mode then start a new polygon after one click', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    map.fire('mousemove', makeMouseEvent(16, 16));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [1, 1]]], 'and has right coordinates');

    container.dispatchEvent(startPolygonEvent);
    assert.equal(Draw.get(polygon.id), undefined, 'polygon was removed');
  });

  await t.test('start draw_polygon mode then doubleclick', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(1, 1));

    assert.equal(Draw.getAll().features.length, 0, 'polygon was removed');
  });

  // TWO CLICK TESTS

  t.test('start draw_polygon mode then enter after two clicks', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(16, 16));
    map.fire('mousemove', makeMouseEvent(8, 0));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [8, 0], [1, 1]]], 'and has right coordinates');

    container.dispatchEvent(enterEvent);
    assert.equal(Draw.getAll().features.length, 0, 'polygon was removed');
  });

  await t.test('start draw_polygon mode then start a point after two clicks', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(16, 16));
    map.fire('mousemove', makeMouseEvent(8, 0));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [8, 0], [1, 1]]], 'and has right coordinates');

    container.dispatchEvent(startPointEvent);
    assert.equal(Draw.get(polygon.id), undefined, 'polygon was removed');
  });

  await t.test('start draw_polygon mode then start a line_string after two clicks', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(16, 16));
    map.fire('mousemove', makeMouseEvent(8, 0));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [8, 0], [1, 1]]], 'and has right coordinates');

    container.dispatchEvent(startLineStringEvent);
    assert.equal(Draw.get(polygon.id), undefined, 'polygon was removed');
  });

  await t.test('start draw_polygon mode then start a new polygon after two clicks', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(16, 16));
    map.fire('mousemove', makeMouseEvent(8, 0));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [8, 0], [1, 1]]], 'and has right coordinates');

    container.dispatchEvent(startPolygonEvent);
    assert.equal(Draw.get(polygon.id), undefined, 'polygon was removed');
  });

  t.test('start draw_polygon mode then doubleclick', () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');

    Draw.changeMode('draw_polygon');
    assert.equal(Draw.getAll().features.length, 1, 'polygon is added');
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(16, 16));
    mouseClick(map, makeMouseEvent(16, 16));

    assert.equal(Draw.getAll().features.length, 0, 'polygon was removed');
  });

  // FIVE CLICK TEST

  await t.test('end draw_polygon mode by clicking on the start point', async () => {
    Draw.deleteAll();
    assert.equal(Draw.getAll().features.length, 0, 'no features yet');
    Draw.changeMode('draw_polygon');
    let polygon = Draw.getAll().features[0];
    assert.equal(polygon !== undefined, true, 'polygon is added');
    mouseClick(map, makeMouseEvent(0, 0));
    mouseClick(map, makeMouseEvent(20, 0));
    mouseClick(map, makeMouseEvent(20, 20));
    mouseClick(map, makeMouseEvent(0, 20));

    await afterNextRender();

    map.fire('mousemove', makeMouseEvent(0, 0));
    mouseClick(map, makeMouseEvent(0, 0));

    polygon = Draw.get(polygon.id);
    assert.deepEqual(polygon.geometry.coordinates, [[[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]]], 'and has right coordinates');
    Draw.deleteAll();
  });

  document.body.removeChild(container);
});


test('draw_polygon touch interaction', async (t) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  await map.on('load');

  // The following sub-tests share state ...

  Draw.changeMode('draw_polygon');
  t.test('first tap', () => {
    touchTap(map, makeTouchEvent(100, 200));

    const { features } = Draw.getAll();
    assert.equal(features.length, 1, 'polygon created');
    const polygon = Draw.getAll().features[0];
    assert.equal(polygon.geometry.type, 'Polygon');

    assert.deepEqual(polygon.geometry.coordinates, [[[100, 200], [100, 200], [100, 200]]], 'starting coordinate added');
  });

  await t.test('tap to add another vertex', () => {
    touchTap(map, makeTouchEvent(135, 135));
    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[100, 200], [135, 135], [135, 135], [100, 200]]], 'middle coordinate replaced');
  });

  await t.test('add more points then tap on the last vertex to finish', () => {
    touchTap(map, makeTouchEvent(400, 400));
    touchTap(map, makeTouchEvent(500, 500));
    touchTap(map, makeTouchEvent(550, 550));
    touchTap(map, makeTouchEvent(550, 550));
    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates,
      [[[100, 200], [135, 135], [400, 400], [500, 500], [550, 550], [100, 200]]],
      'all coordinates in place');

    touchTap(map, makeTouchEvent(400, 400));
    assert.deepEqual(polygon.geometry.coordinates,
      [[[100, 200], [135, 135], [400, 400], [500, 500], [550, 550], [100, 200]]],
      'since we exited draw_polygon mode, another tap does not add a coordinate');
  });

  await t.test('start a polygon but trash it before completion', () => {
    // Start a new polygon
    Draw.deleteAll();
    Draw.changeMode('draw_polygon');
    touchTap(map, makeTouchEvent(100, 100));
    touchTap(map, makeTouchEvent(200, 200));
    touchTap(map, makeTouchEvent(300, 300));

    const polygon = Draw.getAll().features[0];
    assert.deepEqual(polygon.geometry.coordinates, [[[100, 100], [200, 200], [300, 300], [300, 300], [100, 100]]]);

    Draw.trash();
    assert.equal(Draw.getAll().features.length, 0, 'no feature added');

    touchTap(map, makeTouchEvent(1, 1));
    assert.equal(Draw.getAll().features.length, 0, 'no longer drawing');
  });

  document.body.removeChild(container);
});
