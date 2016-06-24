// These tests ensure that user interactions fire the right events

import test from 'tape';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import createSyntheticEvent from 'synthetic-dom-events';
import GLDraw from '../';
import {
  createMap,
  click
} from './test_utils';
import makeMouseEvent from './utils/make_mouse_event';

const container = document.createElement('div');
document.body.appendChild(container);
const map = createMap({ container });
const fireSpy = spy(map, 'fire');
const Draw = GLDraw();
map.addControl(Draw);

map.on('load', runTests);
document.body.removeChild(container);

const backspaceEvent = createSyntheticEvent('keydown', {
  keyCode: 8
});

function runTests() {
  const pointButton = container.getElementsByClassName('mapbox-gl-draw_point')[0];
  const lineButton = container.getElementsByClassName('mapbox-gl-draw_line')[0];
  const trashButton = container.getElementsByClassName('mapbox-gl-draw_trash')[0];
  const polygonButton = container.getElementsByClassName('mapbox-gl-draw_polygon')[0];

  // The sequence of these tests matters: each uses state established
  // in the prior tests. These variables keep track of bits of that state.

  test('enter draw_point mode', t => {
    fireSpy.reset();

    // Click the line button
    pointButton.click();
    firedWith(t, 'draw.modechange', {
      mode: 'draw_point'
    });
    t.deepEqual(flushDrawEvents(), ['draw.modechange'], 'no unexpected draw events');
    t.end();
  });

  const point25_25GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [25, 25]
    }
  };

  test('create a point', t => {
    // Now in `draw_point` mode ...
    // Move around, then click to create the point
    map.fire('mousemove', makeMouseEvent(10, 10));
    map.fire('mousemove', makeMouseEvent(20, 20));
    click(map, makeMouseEvent(25, 25));
    afterNextRender(() => {
      firedWith(t, 'draw.create', {
        features: [point25_25GeoJson]
      });

      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });

      firedWith(t, 'draw.selectionchange', {
        features: [point25_25GeoJson]
      });

      t.deepEqual(flushDrawEvents(), [
        'draw.create',
        'draw.modechange',
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('deselect that point', t => {
    // Now in `simple_select` mode ...
    // Move around, then click away from the selected point
    map.fire('mousemove', makeMouseEvent(10, 10));
    map.fire('mousemove', makeMouseEvent(20, 20));
    click(map, makeMouseEvent(5, 5));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: []
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('re-select that point', t => {
    // Now in `simple_select` mode ...
    // Move around, then click the existing point
    map.fire('mousemove', makeMouseEvent(10, 10));
    map.fire('mousemove', makeMouseEvent(20, 20));
    click(map, makeMouseEvent(25, 25));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: [point25_25GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const point35_15GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [35, 15]
    }
  };

  test('drag that point', t => {
    // Now in `simple_select` mode ...
    map.fire('mousedown', makeMouseEvent(25, 25));
    repeat(10, i => {
      map.fire('mousemove', makeMouseEvent(25 + i, 25 - i));
    });
    map.fire('mouseup', makeMouseEvent(35, 10));
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        type: 'move',
        features: [point35_15GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('delete that point with the Trash button', t => {
    // Now in `simple_select` mode ...
    trashButton.click();
    afterNextRender(() => {
      firedWith(t, 'draw.delete', {
        features: [point35_15GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.delete'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('enter draw_line_string mode', t => {
    // Click the line button
    lineButton.click();
    firedWith(t, 'draw.modechange', {
      mode: 'draw_line_string'
    });
    t.deepEqual(flushDrawEvents(), [
      'draw.modechange'
    ], 'no unexpected draw events');
    t.end();
  });

  const line10_30_50GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[10, 10], [30, 30], [50, 50]]
    }
  };

  test('create a line', t => {
    // Now in `draw_line_string` mode ...
    // Move around, then click and move to create the line
    map.fire('mousemove', makeMouseEvent(10, 10));
    map.fire('mousemove', makeMouseEvent(20, 20));
    click(map, makeMouseEvent(10, 10));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(10 + i, 10 + i));
    });
    click(map, makeMouseEvent(30, 30));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(30 + i, 30 + i));
    });
    click(map, makeMouseEvent(50, 50));
    click(map, makeMouseEvent(50, 50));

    afterNextRender(() => {
      firedWith(t, 'draw.create', {
        features: [line10_30_50GeoJson]
      });

      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });

      firedWith(t, 'draw.selectionchange', {
        features: [line10_30_50GeoJson]
      });

      t.deepEqual(flushDrawEvents(), [
        'draw.create',
        'draw.modechange',
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('deselect that line', t => {
    // Now in `simple_select` mode ...
    click(map, makeMouseEvent(5, 5));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: []
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('re-select that line', t => {
    // Now in `simple_select` mode ...
    // Click somewhere on the line
    click(map, makeMouseEvent(30, 30));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: [line10_30_50GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const line20_40_60GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[20, 0], [40, 20], [60, 40]]
    }
  };

  test('move the line', t => {
    // Now in `simple_select` mode ...
    // Mousedown anywhere on the line, not vertex
    map.fire('mousedown', makeMouseEvent(20, 20));
    // Drag it a little bit
    repeat(10, i => {
      map.fire('mousemove', makeMouseEvent(20 + i, 20 - i));
    });
    // Release the mouse
    map.fire('mouseup', makeMouseEvent(30, 10));

    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        type: 'move',
        features: [line20_40_60GeoJson]
      });

      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('select a vertex', t => {
    // Now in `simple_select` mode ...
    // Click a vertex
    click(map, makeMouseEvent(40, 20));
    afterNextRender(() => {
      firedWith(t, 'draw.modechange', {
        mode: 'direct_select'
      });

      t.deepEqual(flushDrawEvents(), [
        'draw.modechange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const line20_140_60GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[20, 0], [140, 120], [60, 40]]
    }
  };

  test('move the vertex', t => {
    // Now in `direct_select` mode ...
    // Click the vertex again
    map.fire('mousedown', makeMouseEvent(40, 20));
    // Drag it a little bit
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(40 + (5 * i), 20 + (5 * i)));
    });
    // Release the mouse
    map.fire('mouseup', makeMouseEvent(140, 120));
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        type: 'change_coordinates',
        features: [line20_140_60GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const line20_60_140_60GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[20, 0], [80, 60], [140, 120], [60, 40]]
    }
  };

  test('add another vertex', t => {
    // Now in `direct_select` mode ...
    // Click a midpoint
    click(map, makeMouseEvent(80, 60));
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        type: 'change_coordinates',
        features: [line20_60_140_60GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const line20_60_140GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[20, 0], [80, 60], [140, 120]]
    }
  };

  test('delete a vertex with Backspace', t => {
    // Now in `direct_select` mode ...
    // Click a vertex
    click(map, makeMouseEvent(60, 40));
    container.dispatchEvent(backspaceEvent);
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        type: 'change_coordinates',
        features: [line20_60_140GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  // Leaving that line in place while moving on to
  // mess with polygons

  test('enter draw_polygon mode', t => {
    // Click the polygon button
    polygonButton.click();

    firedWith(t, 'draw.modechange', {
      mode: 'draw_polygon'
    });

    firedWith(t, 'draw.selectionchange', {
      features: []
    });

    t.deepEqual(flushDrawEvents(), [
      'draw.modechange',
      'draw.selectionchange'
    ], 'no unexpected draw events');
    t.end();
  });

  const polygon0_0_100_100GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]]]
    }
  };

  test('create a polygon', t => {
    // Now in `draw_polygon` mode ...
    click(map, makeMouseEvent(0, 0));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(0, 0 + (5 * i)));
    });
    click(map, makeMouseEvent(0, 100));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(0 + (5 * i), 100));
    });
    click(map, makeMouseEvent(100, 100));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(100, 100 - (5 * i)));
    });
    click(map, makeMouseEvent(100, 0));
    click(map, makeMouseEvent(100, 0));

    afterNextRender(() => {
      firedWith(t, 'draw.create', {
        features: [polygon0_0_100_100GeoJson]
      });

      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });

      firedWith(t, 'draw.selectionchange', {
        features: [polygon0_0_100_100GeoJson]
      });

      t.deepEqual(flushDrawEvents(), [
        'draw.create',
        'draw.modechange',
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('deselect the polygon', t => {
    // Now in `simple_select` mode ...
    click(map, makeMouseEvent(-10, -10));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: []
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('box-select the line and the polygon', t => {
    // Now in `simple_select` mode ...
    // Mouse down with the shift key
    map.fire('mousedown', makeMouseEvent(200, 200, true));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(200 - (10 * i), 200 - (10 * i)));
    });
    map.fire('mouseup', makeMouseEvent(0, 0));

    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: [line20_60_140GeoJson, polygon0_0_100_100GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const line40_100_160GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[40, -20], [100, 40], [160, 100]]
    }
  };

  const polygon20_20_120_120GeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[20, -20], [20, 80], [120, 80], [120, -20], [20, -20]]]
    }
  };

  test('move the line and the polygon', t => {
    // Now in `simple_select` mode ...
    // Mousedown anywhere on either feature, not a vertex
    map.fire('mousedown', makeMouseEvent(50, 50));
    // Drag it a little bit
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(50 + i, 50 - i));
    });
    // Release the mouse
    map.fire('mouseup', makeMouseEvent(70, 30));

    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        type: 'move',
        features: [line40_100_160GeoJson, polygon20_20_120_120GeoJson]
      });

      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('deselect both', t => {
    // Now in `simple_select` mode ...
    click(map, makeMouseEvent(-10, -10));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: []
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('select the polygon', t => {
    // Now in `simple_select` mode ...
    click(map, makeMouseEvent(100, 50));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: [polygon20_20_120_120GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('add the line to the selection', t => {
    // Now in `simple_select` mode ...
    // shift-click to add to selection
    click(map, makeMouseEvent(100, 40, true));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: [polygon20_20_120_120GeoJson, line40_100_160GeoJson]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });
}

function flushDrawEvents() {
  const drawEvents = [];
  for (let i = 0; i < fireSpy.callCount; i++) {
    const eventName = fireSpy.getCall(i).args[0];
    if (typeof eventName !== 'string' || eventName.indexOf('draw.') !== 0) continue;
    // Ignore draw.render events for now
    if (eventName === 'draw.render') continue;
    drawEvents.push(eventName);
  }
  fireSpy.reset();
  return drawEvents;
}

function getEventCall(eventName) {
  for (let i = 0; i < fireSpy.callCount; i++) {
    const call = fireSpy.getCall(i);
    if (call.args[0] === eventName) return call;
  }
}

function firedWith(tester, eventName, expectedEventData) {
  const call = getEventCall(eventName);
  if (!call) {
    tester.fail(`${eventName} never called`);
    return {};
  }
  tester.pass(`${eventName} called`);
  const actualEventData = Object.assign({}, call.args[1]);

  if (actualEventData.features) {
    actualEventData.features = actualEventData.features.map(withoutId);
  }
  tester.deepEqual(actualEventData, expectedEventData, 'with correct data');
  return call.args[1];
}

function afterNextRender(cb) {
  setTimeout(() => {
    cb();
  }, 32);
}

function withoutId(obj) {
  const clone = Object.assign({}, obj);
  delete clone.id;
  return clone;
}

function repeat(count, fn) {
  for (let i = 1; i <= count; i++) {
    fn(i);
  }
}
