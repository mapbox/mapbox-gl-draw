import test from 'tape';
import createSyntheticEvent from 'synthetic-dom-events';
import GLDraw from '../';
import { click, accessToken, createMap } from './test_utils';
import makeMouseEvent from './utils/make_mouse_event';
import CommonSelectors from '../src/lib/common_selectors';
import drawLineStringMode from '../src/modes/draw_line_string';
import LineString from '../src/feature_types/line_string';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy

function createMockContext() {
  return {
    store: {
      add: spy(),
      delete: spy(),
      featureChanged: spy(),
      clearSelected: spy()
    },
    events: {
      changeMode: spy()
    },
    ui: {
      queueMapClasses: spy(),
      setActiveButton: spy()
    },
    map: {
      doubleClickZoom: {
        disable: spy(),
        enable: spy()
      }
    },
    _test: {}
  };
}

function createMockLifecycleContext() {
  return {
    on: spy()
  };
}

test('draw_line_string mode initialization', t => {
  const context = createMockContext();
  drawLineStringMode(context);

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
  t.deepEqual(Object.assign(context.store.add.getCall(0).args[0], { id: null }),
    Object.assign(emptyLine, { id: null }), 'with a new line');

  t.end();
});

test('draw_line_string start', t => {
  const context = createMockContext();
  const lifecycleContext = createMockLifecycleContext();
  const mode = drawLineStringMode(context);

  mode.start.call(lifecycleContext);
  t.equal(context.store.clearSelected.callCount, 1, 'store.clearSelected called');
  t.equal(context.ui.queueMapClasses.callCount, 1, 'ui.queueMapClasses called');
  t.deepEqual(context.ui.queueMapClasses.getCall(0).args, [{ mouse: 'add' }],
    'ui.queueMapClasses received correct arguments');
  t.equal(context.ui.setActiveButton.callCount, 1, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(0).args, ['line_string'],
    'ui.setActiveButton received correct arguments');

  t.equal(lifecycleContext.on.callCount, 4, 'this.on called');
  t.ok(lifecycleContext.on.calledWith('mousemove', CommonSelectors.true));
  t.ok(lifecycleContext.on.calledWith('click', CommonSelectors.true));
  t.ok(lifecycleContext.on.calledWith('keyup', CommonSelectors.isEscapeKey));
  t.ok(lifecycleContext.on.calledWith('keyup', CommonSelectors.isEnterKey));

  setTimeout(() => {
    t.equal(context.map.doubleClickZoom.disable.callCount, 1);
    t.end();
  }, 10);
});

test('draw_line_string stop with valid line', t => {
  const context = createMockContext();
  const mode = drawLineStringMode(context);

  // Fake a valid line
  context._test.line.isValid = () => true;

  mode.stop.call();
  t.equal(context.ui.setActiveButton.callCount, 1, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(0).args, [],
    'ui.setActiveButton received correct arguments');
  t.equal(context.store.delete.callCount, 0, 'store.delete not called');

  t.end();
});

test('draw_line_string stop with invalid line', t => {
  const context = createMockContext();
  const mode = drawLineStringMode(context);

  // Fake an invalid line
  context._test.line.isValid = () => false;

  mode.stop.call();
  t.equal(context.ui.setActiveButton.callCount, 1, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(0).args, [],
    'ui.setActiveButton received correct arguments');
  t.equal(context.store.delete.callCount, 1, 'store.delete called');
  t.deepEqual(context.store.delete.getCall(0).args, [
    [context._test.line.id],
    { silent: true }
  ], 'store.delete received correct arguments');

  setTimeout(() => {
    t.equal(context.map.doubleClickZoom.enable.callCount, 1);
    t.end();
  }, 10);
});

test('draw_line_string render, active', t => {
  const context = createMockContext();
  const mode = drawLineStringMode(context);

  const place = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: context._test.line.id
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [10, 10]]
    }
  };
  mode.render(geojson, x => place.push(x));
  t.equal(place.length, 1);
  t.deepEqual(place[0], {
    type: 'Feature',
    properties: {
      id: context._test.line.id,
      active: 'true',
      meta: 'feature'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [10, 10]]
    }
  });
  t.end();
});

test('draw_line_string render, inactive', t => {
  const context = createMockContext();
  const mode = drawLineStringMode(context);

  const place = [];
  const geojson = {
    type: 'Feature',
    properties: {
      meta: 'nothing'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [10, 10]]
    }
  };
  mode.render(geojson, x => place.push(x));
  t.equal(place.length, 1);
  t.deepEqual(place[0], {
    type: 'Feature',
    properties: {
      active: 'false',
      meta: 'nothing'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [10, 10]]
    }
  });
  t.end();
});

test('draw_line_string render, no coordinates', t => {
  const context = createMockContext();
  const mode = drawLineStringMode(context);

  const place = [];
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: []
    }
  };
  mode.render(geojson, x => place.push(x));
  t.equal(place.length, 0);

  t.end();
});

mapboxgl.accessToken = accessToken;

test('draw_line_string interaction', t => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = GLDraw();
  map.addControl(Draw);

  map.on('load', () => {
    // The following sub-tests share state ...

    Draw.changeMode('draw_line_string');
    t.test('first click', st => {
      click(map, makeMouseEvent(10, 20));

      const { features } = Draw.getAll();
      st.equal(features.length, 1, 'line created');
      const line = Draw.getAll().features[0];
      st.equal(line.geometry.type, 'LineString');

      st.deepEqual(line.geometry.coordinates, [[10, 20]], 'starting coordinate added');

      st.end();
    });

    t.test('move mouse', st => {
      map.fire('mousemove', makeMouseEvent(15, 23));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[10, 20], [15, 23]], 'last coordinate added');
      st.end();
    });

    t.test('move mouse again', st => {
      map.fire('mousemove', makeMouseEvent(30, 33));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[10, 20], [30, 33]], 'last coordinate replaced');
      st.end();
    });

    t.test('click to add another vertex', st => {
      click(map, makeMouseEvent(35, 35));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[10, 20], [35, 35]], 'last coordinate replaced');
      st.end();
    });

    t.test('add more points then click on the last vertex to finish', st => {
      click(map, makeMouseEvent(40, 40));
      click(map, makeMouseEvent(50, 50));
      click(map, makeMouseEvent(55, 55));
      click(map, makeMouseEvent(55, 55));
      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates,
        [[10, 20], [35, 35], [40, 40], [50, 50], [55, 55]],
        'all coordinates in place');

      click(map, makeMouseEvent(40, 40));
      st.deepEqual(line.geometry.coordinates,
        [[10, 20], [35, 35], [40, 40], [50, 50], [55, 55]],
        'since we exited draw_line_string mode, another click does not add a coordinate');

      st.end();
    });

    t.test('start a line but trash it before completion', st => {
      // Start a new line
      Draw.deleteAll();
      Draw.changeMode('draw_line_string');
      click(map, makeMouseEvent(1, 1));
      click(map, makeMouseEvent(2, 2));
      click(map, makeMouseEvent(3, 3));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [2, 2], [3, 3]]);

      Draw.trash();
      st.equal(Draw.getAll().features.length, 0, 'no feature added');

      click(map, makeMouseEvent(1, 1));
      st.equal(Draw.getAll().features.length, 0, 'no longer drawing');

      st.end();
    });

    t.test('start a line but trash it with Escape before completion', st => {
      // Start a new line
      Draw.deleteAll();
      Draw.changeMode('draw_line_string');
      click(map, makeMouseEvent(1, 1));
      click(map, makeMouseEvent(2, 2));
      click(map, makeMouseEvent(3, 3));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [2, 2], [3, 3]]);

      const escapeEvent = createSyntheticEvent('keyup', {
        keyCode: 27
      });
      container.dispatchEvent(escapeEvent);

      st.equal(Draw.getAll().features.length, 0, 'no feature added');

      click(map, makeMouseEvent(1, 1));
      st.equal(Draw.getAll().features.length, 0, 'no longer drawing');

      st.end();
    });

    t.test('start a line and end it with Enter', st => {
      // Start a new line
      Draw.deleteAll();
      Draw.changeMode('draw_line_string');
      click(map, makeMouseEvent(1, 1));
      click(map, makeMouseEvent(2, 2));
      click(map, makeMouseEvent(3, 3));

      const line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [[1, 1], [2, 2], [3, 3]]);

      const enterEvent = createSyntheticEvent('keyup', {
        keyCode: 13
      });
      container.dispatchEvent(enterEvent);

      st.equal(Draw.getAll().features.length, 1, 'the feature was added');
      st.deepEqual(Draw.getAll().features[0].geometry.coordinates, [[1, 1], [2, 2], [3, 3]], 'the line is correct');

      click(map, makeMouseEvent(1, 1));
      st.equal(Draw.getAll().features.length, 1, 'no longer drawing');

      st.end();
    });

    t.test('start draw_line_string mode then exit before a click', st => {
      Draw.deleteAll();
      st.equal(Draw.getAll().features.length, 0, 'no features yet');

      Draw.changeMode('draw_line_string');
      st.equal(Draw.getAll().features.length, 1, 'line is added');
      let line = Draw.getAll().features[0];
      st.deepEqual(line.geometry.coordinates, [], 'and has no coordinates');

      Draw.changeMode('simple_select');
      st.equal(Draw.getAll().features.length, 0, 'line is removed');

      st.end();
    });

    document.body.removeChild(container);
    t.end();
  });
});
