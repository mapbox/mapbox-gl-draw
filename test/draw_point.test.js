import test from 'tape';
import xtend from 'xtend';
import MapboxDraw from '../index';
import mouseClick from './utils/mouse_click';
import touchTap from './utils/touch_tap';
import createMap from './utils/create_map';
import makeMouseEvent from './utils/make_mouse_event';
import makeTouchEvent from './utils/make_touch_event';
import drawPointModeObject from '../src/modes/draw_point';
import Point from '../src/feature_types/point';
import createMockDrawModeContext from './utils/create_mock_draw_mode_context';
import createMockLifecycleContext from './utils/create_mock_lifecycle_context';
import {escapeEvent, enterEvent} from './utils/key_events';
import objectToMode from '../src/modes/object_to_mode';
const drawPointMode = objectToMode(drawPointModeObject);

test('draw_point mode initialization', (t) => {
  const context = createMockDrawModeContext();
  const lifecycleContext = createMockLifecycleContext();
  const mode = drawPointMode(context);
  mode.start.call(lifecycleContext);

  t.equal(context.store.add.callCount, 1, 'store.add called');

  const emptypoint = new Point(context, {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: []
    }
  });
  // Strip ids for this comparison
  t.deepEqual(xtend(context.store.add.getCall(0).args[0], { id: null }),
    xtend(emptypoint, { id: null }), 'with a new line');

  t.end();
});

test('draw_point start', (t) => {
  const context = createMockDrawModeContext();
  const lifecycleContext = createMockLifecycleContext();
  const mode = drawPointMode(context);
  mode.start.call(lifecycleContext);

  t.equal(context.store.clearSelected.callCount, 1, 'store.clearSelected called');
  t.equal(context.ui.queueMapClasses.callCount, 1, 'ui.queueMapClasses called');
  t.deepEqual(context.ui.queueMapClasses.getCall(0).args, [{ mouse: 'add' }],
    'ui.queueMapClasses received correct arguments');
  t.equal(context.ui.setActiveButton.callCount, 1, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(0).args, ['point'],
    'ui.setActiveButton received correct arguments');

  t.equal(lifecycleContext.on.callCount, 12, 'this.on called');

  t.end();
});

test('draw_point stop with point placed', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawPointMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  // Fake a placed point
  const id = context.store.getAllIds()[0];
  const point = context.store.get(id);
  point.updateCoordinate(10, 20);

  mode.stop.call();
  t.equal(context.ui.setActiveButton.callCount, 2, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(1).args, [undefined],
    'ui.setActiveButton received correct arguments');
  t.equal(context.store.delete.callCount, 0, 'store.delete not called');

  t.end();
});

test('draw_point stop with no point placed', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawPointMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const id = context.store.getAllIds()[0];
  const point = context.store.get(id);

  mode.stop.call();


  t.equal(context.ui.setActiveButton.callCount, 2, 'ui.setActiveButton called');
  t.deepEqual(context.ui.setActiveButton.getCall(1).args, [undefined],
    'ui.setActiveButton received correct arguments');
  t.equal(context.store.delete.callCount, 1, 'store.delete called');
  t.deepEqual(context.store.delete.getCall(0).args, [
    [point.id],
    { silent: true }
  ], 'store.delete received correct arguments');

  t.end();
});

test('draw_point render the active point', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawPointMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const id = context.store.getAllIds()[0];
  const point = context.store.get(id);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      id: point.id
    },
    geometry: {
      type: 'Point',
      coordinates: [10, 10]
    }
  };
  mode.render(geojson, x => memo.push(x));
  t.equal(memo.length, 0, 'active point does not render');
  t.end();
});

test('draw_point render an inactive feature', (t) => {
  const context = createMockDrawModeContext();
  const mode = drawPointMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const memo = [];
  const geojson = {
    type: 'Feature',
    properties: {
      meta: 'nothing'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[10, 10], [20, 20]]
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
      type: 'LineString',
      coordinates: [[10, 10], [20, 20]]
    }
  }, 'unaltered except active: false');
  t.end();
});

test('draw_point mouse interaction', (t) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  map.on('load', () => {
    // The following sub-tests share state ...

    t.test('clicking', (st) => {
      Draw.deleteAll();
      Draw.changeMode('draw_point');
      mouseClick(map, makeMouseEvent(10, 20));

      const { features } = Draw.getAll();
      st.equal(features.length, 1, 'point created');
      const point = Draw.getAll().features[0];
      st.equal(point.geometry.type, 'Point');

      st.deepEqual(point.geometry.coordinates, [10, 20], 'coordinate added');

      mouseClick(map, makeMouseEvent(30, 30));
      st.equal(features.length, 1, 'mode has changed, so another click does not create another point');

      st.end();
    });

    t.test('exist before clicking by hitting Escape', (st) => {
      Draw.deleteAll();
      Draw.changeMode('draw_point');

      container.dispatchEvent(escapeEvent);

      st.equal(Draw.getAll().features.length, 0, 'no feature added');
      mouseClick(map, makeMouseEvent(30, 30));
      st.equal(Draw.getAll().features.length, 0, 'mode has changed, so a click does not create another point');

      st.end();
    });

    t.test('exist before clicking by hitting Enter', (st) => {
      Draw.deleteAll();
      Draw.changeMode('draw_point');

      container.dispatchEvent(enterEvent);

      st.equal(Draw.getAll().features.length, 0, 'no feature added');
      mouseClick(map, makeMouseEvent(30, 30));
      st.equal(Draw.getAll().features.length, 0, 'mode has changed, so a click does not create another point');

      st.end();
    });

    t.test('exist before clicking with Trash', (st) => {
      Draw.deleteAll();
      Draw.changeMode('draw_point');

      Draw.trash();

      st.equal(Draw.getAll().features.length, 0, 'no feature added');
      mouseClick(map, makeMouseEvent(30, 30));
      st.equal(Draw.getAll().features.length, 0, 'mode has changed, so a click does not create another point');

      st.end();
    });

    document.body.removeChild(container);
    t.end();
  });
});


test('draw_point touch interaction', (t) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapboxDraw();
  map.addControl(Draw);

  map.on('load', () => {
    // The following sub-tests share state ...

    t.test('tapping', (st) => {
      Draw.deleteAll();
      Draw.changeMode('draw_point');
      touchTap(map, makeTouchEvent(10, 20));

      const { features } = Draw.getAll();
      st.equal(features.length, 1, 'point created');
      const point = Draw.getAll().features[0];
      st.equal(point.geometry.type, 'Point');

      st.deepEqual(point.geometry.coordinates, [10, 20], 'coordinate added');

      touchTap(map, makeTouchEvent(30, 30));
      st.equal(features.length, 1, 'mode has changed, so another click does not create another point');

      st.end();
    });

    document.body.removeChild(container);
    t.end();
  });
});

