import test from 'tape';
import xtend from 'xtend';
import MapboxDraw from '../index';
import mouseClick from './utils/mouse_click';
import touchTap from './utils/touch_tap';
import createMap from './utils/create_map';
import makeMouseEvent from './utils/make_mouse_event';
import makeTouchEvent from './utils/make_touch_event';
import drawLineStringModeObject from '../src/modes/draw_line_string';
import LineString from '../src/feature_types/line_string';
import createMockDrawModeContext from './utils/create_mock_draw_mode_context';
import createMockLifecycleContext from './utils/create_mock_lifecycle_context';
import setupAfterNextRender from './utils/after_next_render';
import objectToMode from '../src/modes/object_to_mode';
const drawLineStringMode = objectToMode(drawLineStringModeObject);

import {
  enterEvent,
  startPointEvent,
  startLineStringEvent,
  startPolygonEvent,
  escapeEvent
} from './utils/key_events';

test('draw_line_string mode initialization', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  t.equal(context.store.add.callCount, 1, 'store.add called');

  const emptyLine = new LineString(context, {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: []
    }
  });
  // Strip ids for this comparison
  t.deepEqual(xtend(context.store.add.getCall(0).args[0], { id: null }),
    xtend(emptyLine, { id: null }), 'with a new line');

  t.end();
});

test('draw_line_string start', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  t.equal(context.store.clearSelected.callCount, 1, 'store.clearSelected called');
  t.equal(context.ui.queueMapClasses.callCount, 1, 'ui.queueMapClasses called');
  t.deepEqual(context.ui.queueMapClasses.getCall(0).args, [{ mouse: 'add' }],
    'ui.queueMapClasses received correct arguments');
  t.equal(context.ui.setActiveButton.callCount, 1, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(0).args, ['line_string'],
    'ui.setActiveButton received correct arguments');

  setTimeout(() => {
    t.equal(context.map.doubleClickZoom.disable.callCount, 1);
    t.end();
  }, 10);
});

test('draw_line_string stop with valid line', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  // Fake a valid line
  const line = context.store.get(context.store.getAllIds()[0]);
  line.isValid = () => true;

  mode.stop.call();
  t.equal(context.ui.setActiveButton.callCount, 2, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(1).args, [undefined],
    'ui.setActiveButton received correct arguments');
  t.equal(context.store.delete.callCount, 0, 'store.delete not called');

  t.end();
});

test('draw_line_string stop with invalid line', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  // Fake an invalid line
  const line = context.store.get(context.store.getAllIds()[0]);
  line.isValid = () => false;

  mode.stop.call();
  t.equal(context.ui.setActiveButton.callCount, 2, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(1).args, [undefined],
    'ui.setActiveButton received correct arguments');
  t.equal(context.store.delete.callCount, 1, 'store.delete called');
  if (context.store.delete.callCount > 0) {
    t.deepEqual(context.store.delete.getCall(0).args, [
      [line.id],
      { silent: true }
    ], 'store.delete received correct arguments');
  }

  t.end();
});

test('draw_line_string render active line with 0 coordinates', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const line = context.store.get(context.store.getAllIds()[0]);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: line.id
    },
    geometry: {
      type: 'LineString',
      coordinates: []
    }
  };
  mode.render(geojson, x => memo.push(x));
  t.equal(memo.length, 0, 'does not render');
  t.end();
});

test('draw_line_string render active line with 1 coordinate', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const line = context.store.get(context.store.getAllIds()[0]);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: line.id
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0]]
    }
  };
  mode.render(geojson, x => memo.push(x));
  t.equal(memo.length, 0, 'does not render');
  t.end();
});

test('draw_line_string render active line with 2 coordinates', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const line = context.store.get(context.store.getAllIds()[0]);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: line.id
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [10, 10]]
    }
  };
  mode.render(geojson, x => memo.push(x));
  t.equal(memo.length, 2, 'does render');
  t.deepEqual(memo[1], {
    type: 'Feature',
    properties: {
      id: line.id,
      active: 'true',
      meta: 'feature'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [10, 10]]
    }
  }, 'with active: true, meta: feature');
  t.end();
});

test('draw_line_string render inactive feature', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      meta: 'nothing'
    },
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  };
  mode.render(geojson, x => memo.push(x));
  t.equal(memo.length, 1, 'does render');
  t.deepEqual(memo[0], {
    type: 'Feature',
    properties: {
      active: 'false',
      meta: 'nothing'
    },
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  }, 'unaltered except active: false');
  t.end();
});

test('draw_line_string mouse interaction', (t) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapboxDraw();
  map.addControl(Draw);
  const afterNextRender = setupAfterNextRender(map);

  map.on('load', () => {
    // The following sub-tests share state ...

    Draw.changeMode('draw_line_string');
    t.test('first click', (st) => {
      mouseClick(map, makeMouseEvent(10, 20));

      const { features } = Draw.getAll();
      st.equal(features.length, 1, 'line created');
      const line = Draw.getAll().features[0];
      st.equal(line.geometry.type, 'LineString');

      st.deepEqual(line.geometry.coordinates, [[10, 20], [10, 20]], 'starting coordinate added');

      st.end();
    });

    t.test('move mouse', (st) => {
      map.fire('mousemove', makeMouseEvent(15, 23));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[10, 20], [15, 23]], 'last coordinate added');
      st.end();
    });

    t.test('move mouse again', (st) => {
      map.fire('mousemove', makeMouseEvent(30, 33));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[10, 20], [30, 33]], 'last coordinate replaced');
      st.end();
    });

    t.test('click to add another vertex', (st) => {
      mouseClick(map, makeMouseEvent(35, 35));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[10, 20], [35, 35], [35, 35]], 'last coordinate replaced');
      st.end();
    });

    t.test('add more points then click on the last vertex to finish', (st) => {
      mouseClick(map, makeMouseEvent(40, 40));
      mouseClick(map, makeMouseEvent(50, 50));
      mouseClick(map, makeMouseEvent(55, 55));
      mouseClick(map, makeMouseEvent(55, 55));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates,
        [[10, 20], [35, 35], [40, 40], [50, 50], [55, 55]],
        'all coordinates in place');

      mouseClick(map, makeMouseEvent(40, 40));
      st.deepEqual(line.geometry.coordinates,
        [[10, 20], [35, 35], [40, 40], [50, 50], [55, 55]],
        'since we exited draw_line_string mode, another click does not add a coordinate');

      st.end();
    });

    t.test('start a line but trash it before completion', (st) => {
      // Start a new line
      Draw.deleteAll();
      Draw.changeMode('draw_line_string');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(2, 2));
      mouseClick(map, makeMouseEvent(3, 3));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [2, 2], [3, 3], [3, 3]]);

      Draw.trash();
      st.equal(Draw.getAll().features.length, 0, 'no feature added');

      mouseClick(map, makeMouseEvent(1, 1));
      st.equal(Draw.getAll().features.length, 0, 'no longer drawing');

      st.end();
    });

    t.test('start a line but trash it with Escape before completion', (st) => {
      // Start a new line
      Draw.deleteAll();
      Draw.changeMode('draw_line_string');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(2, 2));
      mouseClick(map, makeMouseEvent(3, 3));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [2, 2], [3, 3], [3, 3]]);

      container.dispatchEvent(escapeEvent);

      st.equal(Draw.getAll().features.length, 0, 'no feature added');

      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));
      st.equal(Draw.getAll().features.length, 0, 'no longer drawing');

      st.end();
    });

    // ZERO CLICK TESTS

    t.test('start a line and end it with Enter', (st) => {
      // Start a new line
      Draw.deleteAll();
      Draw.changeMode('draw_line_string');
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));
      mouseClick(map, makeMouseEvent(2, 2));
      mouseClick(map, makeMouseEvent(3, 3));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [2, 2], [3, 3], [3, 3]]);

      container.dispatchEvent(enterEvent);

      st.equal(Draw.getAll().features.length, 1, 'the feature was added');
      st.deepEqual(Draw.getAll().features[0].geometry.coordinates, [[1, 1], [2, 2], [3, 3]], 'the line is correct');

      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));
      st.equal(Draw.getAll().features.length, 1, 'no longer drawing');

      st.end();
    });

    t.test('start draw_line_string mode then changemode before a click', (st) => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_line_string');
      st.equal(Draw.getAll().features.length, 1, 'line is added');
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [], 'and has no coordinates');

      Draw.changeMode('simple_select');
      st.equal(Draw.getAll().features.length, 0, 'line is removed');

      st.end();
    });

    // ONE CLICK TESTS

    t.test('start draw_line_string mode then enter after one click', (st) => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_line_string');
      st.equal(Draw.getAll().features.length, 1, 'line is added');
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [16, 16]], 'and has right coordinates');

      container.dispatchEvent(enterEvent);
      st.equal(Draw.getAll().features.length, 0, 'line_string was removed');

      st.end();
    });

    t.test('start draw_line_string mode then start a point after one click', (st) => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_line_string');
      st.equal(Draw.getAll().features.length, 1, 'line is added');
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [16, 16]], 'and has right coordinates');

      container.dispatchEvent(startPointEvent);
      st.equal(Draw.get(line.id), undefined, 'line_string was removed');

      st.end();
    });

    t.test('start draw_line_string mode then start a line_string after one click', (st) => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_line_string');
      st.equal(Draw.getAll().features.length, 1, 'line is added');
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [16, 16]], 'and has right coordinates');

      container.dispatchEvent(startLineStringEvent);
      st.equal(Draw.get(line.id), undefined, 'line_string was removed');

      st.end();
    });

    t.test('start draw_line_string mode then start a polygon after one click', (st) => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_line_string');
      st.equal(Draw.getAll().features.length, 1, 'line is added');
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire('mousemove', makeMouseEvent(16, 16));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [16, 16]], 'and has right coordinates');

      container.dispatchEvent(startPolygonEvent);
      st.equal(Draw.get(line.id), undefined, 'line_string was removed');

      st.end();
    });

    t.test('start draw_line_string mode then double click', (st) => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_line_string');
      st.equal(Draw.getAll().features.length, 1, 'line is added');
      mouseClick(map, makeMouseEvent(1, 1));
      mouseClick(map, makeMouseEvent(1, 1));

      st.equal(Draw.getAll().features.length, 0, 'line_string was removed');

      st.end();
    });

    // THREE CLICK TEST

    t.test('start draw_line_string mode then double click', (st) => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_line_string');
      let lineString = Draw.getAll().features[0];
      st.equal(lineString !== undefined, true, 'line is added');
      mouseClick(map, makeMouseEvent(0, 0));
      afterNextRender(() => {
        mouseClick(map, makeMouseEvent(15, 15));
        map.fire('mousemove', makeMouseEvent(30, 30));
        afterNextRender(() => {
          map.fire('mousemove', makeMouseEvent(15, 15));
          mouseClick(map, makeMouseEvent(16, 16));
          lineString = Draw.get(lineString.id);
          st.equal(lineString !== undefined, true, 'line_string is here');
          st.deepEqual(lineString, {
            id: lineString.id,
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0], [15, 15]]
            }
          }, 'line_string has the right coordinates');
          st.end();
        });
      });


    });

    document.body.removeChild(container);
    t.end();
  });
});

test('draw_line_string touch interaction', (t) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  map.on('load', () => {
    // The following sub-tests share state ...

    Draw.changeMode('draw_line_string');
    t.test('first tap', (st) => {
      touchTap(map, makeTouchEvent(100, 200));

      const { features } = Draw.getAll();
      st.equal(features.length, 1, 'line created');
      const line = Draw.getAll().features[0];
      st.equal(line.geometry.type, 'LineString');

      st.deepEqual(line.geometry.coordinates, [[100, 200], [100, 200]], 'starting coordinate added');

      st.end();
    });

    t.test('tap to add another vertex', (st) => {
      touchTap(map, makeTouchEvent(200, 400));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[100, 200], [200, 400], [200, 400]], 'last coordinate replaced');
      st.end();
    });

    t.test('add more points then tap on the last vertex to finish', (st) => {
      touchTap(map, makeTouchEvent(400, 500));
      touchTap(map, makeTouchEvent(300, 500));
      touchTap(map, makeTouchEvent(200, 500));
      touchTap(map, makeTouchEvent(200, 500));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates,
        [[100, 200], [200, 400], [400, 500], [300, 500], [200, 500]],
        'all coordinates in place');

      touchTap(map, makeTouchEvent(700, 700));
      st.deepEqual(line.geometry.coordinates,
        [[100, 200], [200, 400], [400, 500], [300, 500], [200, 500]],
        'since we exited draw_line_string mode, another tap does not add a coordinate');

      st.end();
    });

    t.test('start a line but trash it before completion', (st) => {
      // Start a new line
      Draw.deleteAll();
      Draw.changeMode('draw_line_string');
      touchTap(map, makeTouchEvent(100, 100));
      touchTap(map, makeTouchEvent(200, 200));
      touchTap(map, makeTouchEvent(300, 300));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[100, 100], [200, 200], [300, 300], [300, 300]]);

      Draw.trash();
      st.equal(Draw.getAll().features.length, 0, 'no feature added');

      touchTap(map, makeTouchEvent(100, 100));
      st.equal(Draw.getAll().features.length, 0, 'no longer drawing');

      st.end();
    });

    document.body.removeChild(container);
    t.end();
  });
});

test('draw_line_string continue LineString', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const coordinates = [[0, 0], [5, 5], [10, 10]];
  const geojson = {
    type: 'Feature',
    id: 1,
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates.slice(0)
    }
  };
  const line = new LineString(context, geojson);
  context.store.add(line);
  t.throws(
    () => drawLineStringMode(context, { featureId: 2 }).start(lifecycleContext),
    /featureId/,
    'wrong feature id'
  );
  t.throws(
    () => drawLineStringMode(context, { featureId: 1 }).start(lifecycleContext),
    /from.*property/,
    'no "from" prop'
  );
  t.throws(
    () => drawLineStringMode(context, { featureId: 1, from: '[0, 0]' }).start.call(lifecycleContext),
    /from.*property/,
    'incorrect from prop'
  );
  t.throws(
    () => drawLineStringMode(context, { featureId: 1, from: [-1, -1] }).start.call(lifecycleContext),
    /start or the end/,
    'not on line'
  );
  t.throws(
    () => drawLineStringMode(context, { featureId: 1, from: [5, 5] }).start.call(lifecycleContext),
    /start or the end/,
    'not at line endpoint'
  );
  drawLineStringMode(context, { featureId: 1, from: [0, 0] }).start.call(lifecycleContext);

  let testLine = context.store.get(context.store.getAllIds()[0]);
  t.equal(testLine.id, 1, 'initialized with correct line');
  t.deepEqual(testLine.coordinates, [[0, 0], ...coordinates],
    'added one coordinate at the start endpoint');

  drawLineStringMode(context, { featureId: 1, from: [10, 10] }).start.call(lifecycleContext);
  testLine = context.store.get(context.store.getAllIds()[0]);
  t.deepEqual(testLine.coordinates, [[0, 0], ...coordinates, [10, 10]],
    'added one coordinate at the end endpoint');

  t.doesNotThrow(
    () => drawLineStringMode(context, { featureId: 1, from: { type: 'Point', coordinates: [0, 0] } }).start.call(lifecycleContext),
    'initializes with Point'
  );

  t.doesNotThrow(
    () => drawLineStringMode(context, {
      featureId: 1,
      from: { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }
    }).start.call(lifecycleContext),
    'initializes with a Feature<Point>'
  );

  t.end();
});

test('draw_line_string continue LineString mouseClick', (t) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapboxDraw();
  map.addControl(Draw);
  const afterNextRender = setupAfterNextRender(map);

  map.on('load', () => {
    const coordinates = [[0, 0], [5, 5], [10, 10]];
    const geojson = {
      type: 'Feature',
      id: 1,
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates.slice(0)
      }
    };
    Draw.add(geojson);

    Draw.changeMode('draw_line_string', { featureId: 1, from: [0, 0] });
    mouseClick(map, makeMouseEvent(-1, -1));
    afterNextRender(() => {
      const line = Draw.getAll().features[0];
      t.deepEqual(line.geometry.coordinates, [[-1, -1], [-1, -1], ...coordinates], 'line continues from the start');
      Draw.changeMode('draw_line_string', { featureId: 1, from: [10, 10] });
      mouseClick(map, makeMouseEvent(12, 12));
      afterNextRender(() => {
        const line = Draw.getAll().features[0];
        t.deepEqual(line.geometry.coordinates, [[-1, -1], ...coordinates, [12, 12], [12, 12]], 'line continues from the end');
      });
    });
  });

  document.body.removeChild(container);
  t.end();
});
