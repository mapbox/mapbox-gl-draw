// These tests ensure that user interactions fire the right events

import test from 'tape';
import xtend from 'xtend';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import createSyntheticEvent from 'synthetic-dom-events';
import MapboxDraw from '../';
import click from './utils/mouse_click';
import createMap from './utils/create_map';
import createAfterNextRender from './utils/after_next_render';
import makeMouseEvent from './utils/make_mouse_event';

const container = document.createElement('div');
document.body.appendChild(container);
const map = createMap({ container });
const fireSpy = spy(map, 'fire');
const afterNextRender = createAfterNextRender(map);
const Draw = new MapboxDraw();
const onAdd = Draw.onAdd.bind(Draw);
let controlGroup = null;
Draw.onAdd = function(m) {
  controlGroup = onAdd(m);
  return controlGroup;
};

map.addControl(Draw);

map.on('load', runTests);
document.body.removeChild(container);

const backspaceEvent = createSyntheticEvent('keydown', {
  keyCode: 8
});
const enterEvent = createSyntheticEvent('keyup', {
  keyCode: 13
});
const escapeEvent = createSyntheticEvent('keyup', {
  keyCode: 27
});

function runTests() {
  const pointButton = controlGroup.getElementsByClassName('mapbox-gl-draw_point')[0];
  const lineCutton = controlGroup.getElementsByClassName('mapbox-gl-draw_line')[0];
  const trashButton = controlGroup.getElementsByClassName('mapbox-gl-draw_trash')[0];
  const polygonEutton = controlGroup.getElementsByClassName('mapbox-gl-draw_polygon')[0];

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

  const pointA = {
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
        features: [pointA]
      });

      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });

      firedWith(t, 'draw.selectionchange', {
        features: [pointA]
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
        features: [pointA]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const pointB = {
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
      map.fire('mousemove', makeMouseEvent(25 + i, 25 - i, { buttons: 1 }));
    });
    map.fire('mouseup', makeMouseEvent(35, 10));
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        action: 'move',
        features: [pointB]
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
        features: [pointB]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.delete'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('enter draw_line_string mode', t => {
    // Click the line button
    lineCutton.click();
    firedWith(t, 'draw.modechange', {
      mode: 'draw_line_string'
    });
    t.deepEqual(flushDrawEvents(), [
      'draw.modechange'
    ], 'no unexpected draw events');
    t.end();
  });

  const lineA = {
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
        features: [lineA]
      });

      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });

      firedWith(t, 'draw.selectionchange', {
        features: [lineA]
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
        features: [lineA]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const lineB = {
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
      map.fire('mousemove', makeMouseEvent(20 + i, 20 - i, { buttons: 1 }));
    });
    // Release the mouse
    map.fire('mouseup', makeMouseEvent(40, 0));

    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        action: 'move',
        features: [lineB]
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

  const lineC = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[20, 0], [62, 42], [60, 40]]
    }
  };

  test('move the vertex', t => {
    // Now in `direct_select` mode ...
    // Click the vertex again
    map.fire('mousedown', makeMouseEvent(40, 20));
    // Drag it a little bit
    repeat(22, i => {
      map.fire('mousemove', makeMouseEvent(40 + i, 20 + i, { buttons: 1 }));
    });
    // Release the mouse
    map.fire('mouseup', makeMouseEvent(60, 40));
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        action: 'change_coordinates',
        features: [lineC]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const lineD = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[20, 0], [41, 21], [62, 42], [60, 40]]
    }
  };

  test('add another vertex', t => {
    // Now in `direct_select` mode ...
    // Click a midpoint of lineC
    click(map, makeMouseEvent(41, 21));
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        action: 'change_coordinates',
        features: [lineD]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const lineE = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[20, 0], [62, 42], [60, 40]]
    }
  };

  test('delete a vertex with Backspace', t => {
    // Now in `direct_select` mode ...
    // Click a vertex
    click(map, makeMouseEvent(41, 21));
    container.dispatchEvent(backspaceEvent);
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        action: 'change_coordinates',
        features: [lineE]
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
    polygonEutton.click();

    afterNextRender(() => {
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
  });

  const polygonA = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 30], [30, 30], [30, 0], [0, 0]]]
    }
  };

  test('create a polygon', t => {
    // Now in `draw_polygon` mode ...
    click(map, makeMouseEvent(0, 0));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(0, 0 + i));
    });
    click(map, makeMouseEvent(0, 30));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(0 + i, 30));
    });
    click(map, makeMouseEvent(30, 30));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(30, 30 - i));
    });
    click(map, makeMouseEvent(30, 0));
    click(map, makeMouseEvent(30, 0));

    afterNextRender(() => {
      firedWith(t, 'draw.create', {
        features: [polygonA]
      });

      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });

      firedWith(t, 'draw.selectionchange', {
        features: [polygonA]
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
    map.fire('mousedown', makeMouseEvent(200, 200, { shiftKey: true }));
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(200 - (10 * i), 200 - (10 * i), { buttons: 1 }));
    });
    map.fire('mouseup', makeMouseEvent(0, 0));

    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: [lineE, polygonA]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const lineF = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[40, -20], [82, 22], [80, 20]]
    }
  };

  const polygonB = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[20, -20], [20, 10], [50, 10], [50, -20], [20, -20]]]
    }
  };

  test('move the line and the polygon', t => {
    // Now in `simple_select` mode ...
    // Mousedown anywhere on either feature, not a vertex
    map.fire('mousedown', makeMouseEvent(0, 15));
    // Drag it a little bit
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(0 + i, 15 - i, { buttons: 1 }));
    });
    // Release the mouse
    map.fire('mouseup', makeMouseEvent(20, -5));

    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        action: 'move',
        features: [lineF, polygonB]
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
    click(map, makeMouseEvent(48, 0));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: [polygonB]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('select a vertex', t => {
    // Now in `simple_select` mode ...
    click(map, makeMouseEvent(20, -20));
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

  test('add another vertex to the selection', t => {
    // Now in `simple_select` mode ...
    click(map, makeMouseEvent(20, 10, { shiftKey: true }));
    afterNextRender(() => {
      t.deepEqual(flushDrawEvents(), [], 'no unexpected draw events');
      t.end();
    });
  });

  const polygonC = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, -20], [0, 10], [50, 10], [50, -20], [0, -20]]]
    }
  };

  test('move the vertices', t => {
    // Now in `direct_select` mode ...
    // Click a vertex again
    map.fire('mousedown', makeMouseEvent(20, 10));
    // Drag it a little bit
    repeat(20, i => {
      map.fire('mousemove', makeMouseEvent(20 - i, 10, { buttons: 1 }));
    });
    // Release the mouse
    map.fire('mouseup', makeMouseEvent(0, 10));

    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        action: 'change_coordinates',
        features: [polygonC]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const polygonD = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, -20], [0, 10], [25, 10], [50, 10], [50, -20], [0, -20]]]
    }
  };

  test('add another vertex', t => {
    // Now in `direct_select` mode ...
    // Click a midpoint
    click(map, makeMouseEvent(25, 10));
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        action: 'change_coordinates',
        features: [polygonD]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  const polygonE = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 10], [50, 10], [50, -20], [0, 10]]]
    }
  };

  test('select then delete two vertices with Draw.trash()', t => {
    // Now in `direct_select` mode ...
    click(map, makeMouseEvent(0, -20));
    click(map, makeMouseEvent(25, 10, { shiftKey: true }));
    Draw.trash();
    afterNextRender(() => {
      firedWith(t, 'draw.update', {
        action: 'change_coordinates',
        features: [polygonE]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('select the polygon', t => {
    // Deselect everything
    click(map, makeMouseEvent(-200, -200));
    afterNextRender(() => {
      flushDrawEvents();
      // Now in `simple_select` mode ...
      // Click the polygon
      click(map, makeMouseEvent(50, 10));
      afterNextRender(() => {
        firedWith(t, 'draw.selectionchange', {
          features: [polygonE]
        });
        t.deepEqual(flushDrawEvents(), [
          'draw.selectionchange'
        ], 'no unexpected draw events');
        t.end();
      });
    });
  });

  test('add the line to the selection', t => {
    // Now in `simple_select` mode ...
    // shift-click to add to selection
    click(map, makeMouseEvent(82, 22, { shiftKey: true }));
    afterNextRender(() => {
      firedWith(t, 'draw.selectionchange', {
        features: [polygonE, lineF]
      });
      t.deepEqual(flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  // Below are tests to ensure that API usage to modify data does not
  // trigger events, only user interactions
  test('API usage does not trigger events', t => {
    Draw.deleteAll();
    Draw.add({
      type: 'Feature',
      id: 'point',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [10, 10]
      }
    });
    Draw.add({
      type: 'Feature',
      id: 'line',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[10, 10], [20, 20]]
      }
    });
    Draw.changeMode('draw_point');
    Draw.changeMode('draw_line_string');
    Draw.changeMode('draw_polygon');
    Draw.changeMode('simple_select');
    Draw.delete('point');
    afterNextRender(() => {
      t.deepEqual(flushDrawEvents(), [], 'no unexpected draw events');
      t.end();
    });
  });

  test('except when the API function does not directly correspond to the event', t => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[10, 10], [20, 20], [30, 30]]
      }
    };
    const lineId = Draw.add(line)[0];
    Draw.changeMode('simple_select', {
      featureIds: [lineId]
    });
    afterNextRender(() => {
      Draw.trash();
      afterNextRender(() => {
        firedWith(t, 'draw.delete', {
          features: [line]
        });
        t.deepEqual(flushDrawEvents(), [
          'draw.delete'
        ], 'no unexpected draw events');
        t.end();
      });
    });
  });

  test('start draw_point mode then exit with Enter', t => {
    Draw.deleteAll();
    Draw.changeMode('draw_point');
    container.dispatchEvent(enterEvent);
    afterNextRender(() => {
      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });
      t.equal(Draw.getAll().features.length, 0, 'no feature created');
      t.deepEqual(flushDrawEvents(), [
        'draw.modechange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('start draw_point mode then exit with Escape', t => {
    Draw.deleteAll();
    Draw.changeMode('draw_point');
    container.dispatchEvent(escapeEvent);
    afterNextRender(() => {
      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });
      t.equal(Draw.getAll().features.length, 0, 'no feature created');
      t.deepEqual(flushDrawEvents(), [
        'draw.modechange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('start draw_line_string mode and drawing a line then finish with Enter', t => {
    Draw.deleteAll();
    Draw.changeMode('draw_line_string');
    click(map, makeMouseEvent(240, 240));
    click(map, makeMouseEvent(260, 260));
    container.dispatchEvent(enterEvent);
    afterNextRender(() => {
      const expectedLine = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [[240, 240], [260, 260]]
        }
      };
      firedWith(t, 'draw.create', {
        features: [expectedLine]
      });

      firedWith(t, 'draw.selectionchange', {
        features: [expectedLine]
      });

      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });

      t.deepEqual(flushDrawEvents(), [
        'draw.create',
        'draw.modechange',
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('start draw_line_string mode then exit with Escape', t => {
    Draw.deleteAll();
    Draw.changeMode('draw_line_string');
    click(map, makeMouseEvent(0, 0));
    click(map, makeMouseEvent(20, 20));
    container.dispatchEvent(escapeEvent);
    afterNextRender(() => {
      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });
      t.equal(Draw.getAll().features.length, 0, 'no feature created');
      t.deepEqual(flushDrawEvents(), [
        'draw.modechange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('start draw_polygon mode and drawing a polygon then finish with Enter', t => {
    Draw.deleteAll();
    Draw.changeMode('draw_polygon');
    click(map, makeMouseEvent(240, 240));
    click(map, makeMouseEvent(260, 260));
    click(map, makeMouseEvent(300, 200));
    container.dispatchEvent(enterEvent);
    afterNextRender(() => {
      const expectedPolygon = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[[240, 240], [260, 260], [300, 200], [240, 240]]]
        }
      };
      firedWith(t, 'draw.create', {
        features: [expectedPolygon]
      });

      firedWith(t, 'draw.selectionchange', {
        features: [expectedPolygon]
      });

      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });

      t.deepEqual(flushDrawEvents(), [
        'draw.create',
        'draw.modechange',
        'draw.selectionchange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('start draw_polygon mode then exit with Escape', t => {
    Draw.deleteAll();
    Draw.changeMode('draw_polygon');
    click(map, makeMouseEvent(0, 0));
    click(map, makeMouseEvent(20, 20));
    click(map, makeMouseEvent(30, 30));
    container.dispatchEvent(escapeEvent);
    afterNextRender(() => {
      firedWith(t, 'draw.modechange', {
        mode: 'simple_select'
      });
      t.equal(Draw.getAll().features.length, 0, 'no feature created');
      t.deepEqual(flushDrawEvents(), [
        'draw.modechange'
      ], 'no unexpected draw events');
      t.end();
    });
  });

  test('box selection includes no features', t => {
    Draw.deleteAll();
    Draw.changeMode('simple_select');
    click(map, makeMouseEvent(0, 0, { shiftKey: true }));
    click(map, makeMouseEvent(100, 100, { shiftKey: true }));
    afterNextRender(() => {
      t.deepEqual(flushDrawEvents(), [], 'no unexpected draw events');
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
    // Ignore draw.actionable events for now
    if (eventName === 'draw.actionable') continue;
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
  const actualEventData = xtend(call.args[1]);

  if (actualEventData.features) {
    actualEventData.features = actualEventData.features.map(withoutId);
  }
  tester.deepEqual(actualEventData, expectedEventData, 'with correct data');
  return call.args[1];
}

function withoutId(obj) {
  const clone = xtend(obj);
  delete clone.id;
  return clone;
}

function repeat(count, fn) {
  for (let i = 1; i <= count; i++) {
    fn(i);
  }
}
