import test from 'tape';
import xtend from 'xtend';
import MapboxDraw from '../';
import createMap from './utils/create_map';
import mouseClick from './utils/mouse_click';
import makeMouseEvent from './utils/make_mouse_event';
import CommonSelectors from '../src/lib/common_selectors';
import drawPolygonMode from '../src/modes/draw_polygon';
import Polygon from '../src/feature_types/polygon';
import createMockDrawModeContext from './utils/create_mock_draw_mode_context';
import createMockLifecycleContext from './utils/create_mock_lifecycle_context';
import setupAfterNextRender from './utils/after_next_render';
import {
  enterEvent,
  startPointEvent,
  startLineStringEvent,
  startPolygonEvent,
  escapeEvent
} from './utils/key_events';

test('draw_polygon mode initialization', t => {
  const context = createMockDrawModeContext();
  drawPolygonMode(context);

  t.equal(context.store.add.callCount, 1, 'store.add called');

  const emptyPolygon = new Polygon(context, {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[]]
    }
  });
  // Strip ids for this comparison
  t.deepEqual(xtend(context.store.add.getCall(0).args[0], { id: null }),
    xtend(emptyPolygon, { id: null }), 'with a new polygon');

  t.end();
});

test('draw_polygon start', t => {
  const context = createMockDrawModeContext();
  const lifecycleContext = createMockLifecycleContext();
  const mode = drawPolygonMode(context);

  mode.start.call(lifecycleContext);
  t.equal(context.store.clearSelected.callCount, 1, 'store.clearSelected called');
  t.equal(context.ui.queueMapClasses.callCount, 1, 'ui.queueMapClasses called');
  t.deepEqual(context.ui.queueMapClasses.getCall(0).args, [{ mouse: 'add' }],
    'ui.queueMapClasses received correct arguments');
  t.equal(context.ui.setActiveButton.callCount, 1, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(0).args, ['polygon'],
    'ui.setActiveButton received correct arguments');

  t.equal(lifecycleContext.on.callCount, 5, 'this.on called');
  t.ok(lifecycleContext.on.calledWith('mousemove', CommonSelectors.true));
  t.ok(lifecycleContext.on.calledWith('click', CommonSelectors.isVertex));
  t.ok(lifecycleContext.on.calledWith('click', CommonSelectors.true));
  t.ok(lifecycleContext.on.calledWith('keyup', CommonSelectors.isEscapeKey));
  t.ok(lifecycleContext.on.calledWith('keyup', CommonSelectors.isEnterKey));

  setTimeout(() => {
    t.equal(context.map.doubleClickZoom.disable.callCount, 1);
    t.end();
  }, 10);
});

test('draw_polygon stop with valid polygon', t => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);

  // Fake a valid polygon
  context._test.polygon.isValid = () => true;

  mode.stop.call();
  t.equal(context.ui.setActiveButton.callCount, 1, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(0).args, [],
    'ui.setActiveButton received correct arguments');
  t.equal(context.store.delete.callCount, 0, 'store.delete not called');

  t.end();
});

test('draw_polygon stop with invalid polygon', t => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);

  // Fake an invalid polygon
  context._test.polygon.isValid = () => false;

  mode.stop.call();
  t.equal(context.ui.setActiveButton.callCount, 1, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(0).args, [],
    'ui.setActiveButton received correct arguments');
  t.equal(context.store.delete.callCount, 1, 'store.delete called');
  t.deepEqual(context.store.delete.getCall(0).args, [
    [context._test.polygon.id],
    { silent: true }
  ], 'store.delete received correct arguments');

  setTimeout(() => {
    t.equal(context.map.doubleClickZoom.enable.callCount, 1);
    t.end();
  }, 10);
});

test('draw_polygon render active polygon with no coordinates', t => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: context._test.polygon.id
    },
    geometry: {
      type: 'Polygon',
      coordinates: []
    }
  };
  mode.render(geojson, x => memo.push(x));
  t.equal(memo.length, 0, 'does not render');

  t.end();
});

test('draw_polygon render active polygon with 1 coordinate (and closer)', t => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: context._test.polygon.id
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[10, 10], [10, 10]]]
    }
  };
  mode.render(geojson, x => memo.push(x));
  t.equal(memo.length, 0, 'does not render');

  t.end();
});

test('draw_polygon render active polygon with 2 coordinates (and closer)', t => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: context._test.polygon.id
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 10], [0, 0]]]
    }
  };
  mode.render(geojson, x => memo.push(x));
  t.equal(memo.length, 1, 'does render');
  t.deepEqual(memo[0], {
    type: 'Feature',
    properties: {
      id: context._test.polygon.id,
      active: 'true',
      meta: 'feature'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [0, 10]]
    }
  }, 'renders as a LineString with meta: feature, active: true');
  t.end();
});

test('draw_polygon render active polygon with 3 coordinates (and closer)', t => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: context._test.polygon.id
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
    }
  };
  mode.render(geojson, x => memo.push(x));
  t.equal(memo.length, 3, 'does render');
  t.deepEqual(memo[0], {
    type: 'Feature',
    properties: {
      parent: context._test.polygon.id,
      meta: 'vertex',
      coord_path: '0.0',
      active: 'false'
    },
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  }, 'renders the start point point with meta: vertex');
  t.deepEqual(memo[1], {
    type: 'Feature',
    properties: {
      parent: context._test.polygon.id,
      meta: 'vertex',
      coord_path: '0.2',
      active: 'false'
    },
    geometry: {
      type: 'Point',
      coordinates: [10, 10]
    }
  }, 'renders end point with meta: vertex');
  t.deepEqual(memo[2], {
    type: 'Feature',
    properties: {
      id: context._test.polygon.id,
      active: 'true',
      meta: 'feature'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
    }
  }, 'renders as a polygon with meta: feature, active: true');
  t.end();
});

test('draw_polygon render inactive feature', t => {
  const context = createMockDrawModeContext();
  const mode = drawPolygonMode(context);

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
  t.equal(memo.length, 1, 'does render');
  t.deepEqual(memo[0], {
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
  t.end();
});

test('draw_polygon interaction', t => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  map.on('load', () => {
    // The following sub-tests share state ...
    const afterNextRender = setupAfterNextRender(map);

    Draw.changeMode('draw_polygon');
    t.test('first click', st => {
      mouseClick(map, makeMouseEvent(10, 20));

      const { features } = Draw.getAll();
      st.equal(features.length, 1, 'polygon created');
      const polygon = Draw.getAll().features[0];
      st.equal(polygon.geometry.type, 'Polygon');

      st.deepEqual(polygon.geometry.coordinates, [[[10, 20], [10, 20]]], 'starting coordinate added');

      st.end();
    });

    t.test('move mouse', st => {
      map.fire('mousemove', makeMouseEvent(15, 23));
      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[10, 20], [15, 23], [10, 20]]], 'middle coordinate added');
      st.end();
    });

    t.test('move mouse again', st => {
      map.fire('mousemove', makeMouseEvent(30, 33));
      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[10, 20], [30, 33], [10, 20]]], 'middle coordinate replaced');
      st.end();
    });

    t.test('click to add another vertex', st => {
      mouseClick(map, makeMouseEvent(35, 35));
      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[10, 20], [35, 35], [10, 20]]], 'middle coordinate replaced');
      st.end();
    });

    t.test('add more points then click on the last vertex to finish', st => {
      mouseClick(map, makeMouseEvent(40, 40));
      mouseClick(map, makeMouseEvent(50, 50));
      mouseClick(map, makeMouseEvent(55, 55));
      mouseClick(map, makeMouseEvent(55, 55));
      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates,
        [[[10, 20], [35, 35], [40, 40], [50, 50], [55, 55], [10, 20]]],
        'all coordinates in place');

      mouseClick(map, makeMouseEvent(40, 40));
      st.deepEqual(polygon.geometry.coordinates,
        [[[10, 20], [35, 35], [40, 40], [50, 50], [55, 55], [10, 20]]],
        'since we exited draw_polygon mode, another click does not add a coordinate');

      st.end();
    });

    t.test('start a polygon but trash it before completion', st => {
      // Start a new polygon
      Draw.deleteAll();
      Draw.changeMode('draw_polygon');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(2, 2));
      mouseClick(map, makeMouseEvent(3, 3));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [2, 2], [3, 3], [1, 1]]]);

      Draw.trash();
      st.equal(Draw.getAll().features.length, 0, 'no feature added');

      mouseClick(map, makeMouseEvent(1, 1));
      st.equal(Draw.getAll().features.length, 0, 'no longer drawing');

      st.end();
    });

    t.test('start a polygon but trash it with Escape before completion', st => {
      // Start a new polygon
      Draw.deleteAll();
      Draw.changeMode('draw_polygon');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(2, 2));
      mouseClick(map, makeMouseEvent(3, 3));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [2, 2], [3, 3], [1, 1]]]);

      container.dispatchEvent(escapeEvent);

      st.equal(Draw.getAll().features.length, 0, 'no feature added');

      mouseClick(map, makeMouseEvent(1, 1));
      st.equal(Draw.getAll().features.length, 0, 'no longer drawing');

      st.end();
    });

    // ZERO CLICK TESTS

    t.test('start a polygon and end it with Enter', st => {
      // Start a new polygon
      Draw.deleteAll();
      Draw.changeMode('draw_polygon');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(2, 2));
      mouseClick(map, makeMouseEvent(3, 3));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [2, 2], [3, 3], [1, 1]]]);

      container.dispatchEvent(enterEvent);

      st.equal(Draw.getAll().features.length, 1, 'the feature was added');
      st.deepEqual(Draw.getAll().features[0].geometry.coordinates, [[[1, 1], [2, 2], [3, 3], [1, 1]]], 'the polygon is correct');

      mouseClick(map, makeMouseEvent(1, 1));
      st.equal(Draw.getAll().features.length, 1, 'no longer drawing');

      st.end();
    });

    t.test('start draw_polygon mode then changemode before a click', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.type, 'Polygon');

      Draw.changeMode('simple_select');
      st.equal(Draw.getAll().features.length, 0, 'polygon is removed');

      st.end();
    });

    // ONE CLICK TESTS

    t.test('start draw_polygon mode then enter after one click', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [1, 1]]], 'and has right coordinates');

      container.dispatchEvent(enterEvent);
      st.equal(Draw.getAll().features.length, 0, 'polygon was removed');

      st.end();
    });

    t.test('start draw_polygon mode then start a point after one click', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [1, 1]]], 'and has right coordinates');

      container.dispatchEvent(startPointEvent);
      st.equal(Draw.get(polygon.id), undefined, 'polygon was removed');

      st.end();
    });

    t.test('start draw_polygon mode then start a line_string after one click', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [1, 1]]], 'and has right coordinates');

      container.dispatchEvent(startLineStringEvent);
      st.equal(Draw.get(polygon.id), undefined, 'polygon was removed');

      st.end();
    });

    t.test('start draw_polygon mode then start a new polygon after one click', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [1, 1]]], 'and has right coordinates');

      container.dispatchEvent(startPolygonEvent);
      st.equal(Draw.get(polygon.id), undefined, 'polygon was removed');

      st.end();
    });

    t.test('start draw_polygon mode then doubleclick', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(1, 1));

      st.equal(Draw.getAll().features.length, 0, 'polygon was removed');

      st.end();
    });

    // TWO CLICK TESTS

    t.test('start draw_polygon mode then enter after two clicks', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(16, 16));
      map.fire('mousemove', makeMouseEvent(8, 0));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [8, 0], [1, 1]]], 'and has right coordinates');

      container.dispatchEvent(enterEvent);
      st.equal(Draw.getAll().features.length, 0, 'polygon was removed');
      st.end();
    });

    t.test('start draw_polygon mode then start a point after two clicks', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(16, 16));
      map.fire('mousemove', makeMouseEvent(8, 0));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [8, 0], [1, 1]]], 'and has right coordinates');

      container.dispatchEvent(startPointEvent);
      st.equal(Draw.get(polygon.id), undefined, 'polygon was removed');

      st.end();
    });

    t.test('start draw_polygon mode then start a line_string after two clicks', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(16, 16));
      map.fire('mousemove', makeMouseEvent(8, 0));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [8, 0], [1, 1]]], 'and has right coordinates');

      container.dispatchEvent(startLineStringEvent);
      st.equal(Draw.get(polygon.id), undefined, 'polygon was removed');

      st.end();
    });

    t.test('start draw_polygon mode then start a new polygon after two clicks', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(16, 16));
      map.fire('mousemove', makeMouseEvent(8, 0));

      const polygon = Draw.getAll().features[0];
      st.deepEqual(polygon.geometry.coordinates, [[[1, 1], [16, 16], [8, 0], [1, 1]]], 'and has right coordinates');

      container.dispatchEvent(startPolygonEvent);
      st.equal(Draw.get(polygon.id), undefined, 'polygon was removed');

      st.end();
    });

    t.test('start draw_polygon mode then doubleclick', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_polygon');
      st.equal(Draw.getAll().features.length, 1, 'polygon is added');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(16, 16));
      mouseClick(map, makeMouseEvent(16, 16));

      st.equal(Draw.getAll().features.length, 0, 'polygon was removed');

      st.end();
    });

    // FIVE CLICK TEST

    t.test('end draw_polygon mode by clicking on the start point', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');
      Draw.changeMode('draw_polygon');
      let polygon = Draw.getAll().features[0];
      st.equal(polygon !== undefined, true, 'polygon is added');
      mouseClick(map, makeMouseEvent(0, 0));
      mouseClick(map, makeMouseEvent(20, 0));
      mouseClick(map, makeMouseEvent(20, 20));
      mouseClick(map, makeMouseEvent(0, 20));

      afterNextRender(() => {
        map.fire('mousemove', makeMouseEvent(0, 0));
        mouseClick(map, makeMouseEvent(0, 0));

        polygon = Draw.get(polygon.id);
        st.deepEqual(polygon.geometry.coordinates, [[[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]]], 'and has right coordinates');
        Draw.deleteAll();
        st.end();
      });
    });

    document.body.removeChild(container);
    t.end();
  });
});
