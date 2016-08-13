import test from 'tape';
import createTestMap from './utils/create_test_map';

test('enter draw_line_string mode by clicking the button', t => {
  createTestMap().then(map => {
    map.lineButton.click();
    t.deepEqual(map.getEventData('draw.modechange'), {
      mode: map.Draw.modes.DRAW_LINE_STRING
    });
    t.deepEqual(map.flushDrawEvents(), [
      'draw.modechange'
    ], 'no unexpected draw events');
    map.destroy();
    t.end();
  }).catch(t.end);
});

test('draw a line', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.DRAW_LINE_STRING);
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[10, 10], [30, 30], [50, 50]]
      }
    };

    map.click(10, 10);
    map.mousemove([10, 10], [30, 30]);
    map.click(30, 30);
    map.mousemove([30, 30], [50, 50]);
    map.click(50, 50);
    map.click(50, 50);
    return map.awaitRender().then(() => {
      t.deepEqual(map.getEventData('draw.create'), {
        features: [line]
      });
      t.deepEqual(map.getEventData('draw.modechange'), {
        mode: 'simple_select'
      });
      t.deepEqual(map.getEventData('draw.selectionchange'), {
        features: [line]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.create',
        'draw.modechange',
        'draw.selectionchange'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('select a line', t => {
  createTestMap().then(map => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[10, 10], [30, 30], [50, 50]]
      }
    };
    map.Draw.add(line);

    return map.awaitRender().then(() => {
      map.click(30, 30);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.selectionchange'), {
        features: [line]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('deselect a selected line', t => {
  createTestMap().then(map => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[10, 10], [30, 30], [50, 50]]
      }
    };
    const [lineId] = map.Draw.add(line);

    map.select(lineId);
    map.click(5, 5);
    return map.awaitRender().then(() => {
      t.deepEqual(map.getEventData('draw.selectionchange'), {
        features: []
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('drag a line', t => {
  createTestMap().then(map => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[10, 10], [30, 30], [50, 50]]
      }
    };
    const [lineId] = map.Draw.add(line);

    map.select(lineId);
    map.awaitRender().then(() => {
      map.drag([20, 20], [30, 10]);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.update'), {
        action: 'move',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [[20, 0], [40, 20], [60, 40]]
          }
        }]
      });

      t.deepEqual(map.flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('select a vertex', t => {
  createTestMap().then(map => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[20, 0], [40, 20], [60, 40]]
      }
    };
    const [lineId] = map.Draw.add(line);

    map.select(lineId);
    return map.awaitRender().then(() => {
      map.click(40, 20);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.modechange'), {
        mode: 'direct_select'
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.modechange'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('drag a vertex', t => {
  createTestMap().then(map => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[20, 0], [40, 20], [60, 40]]
      }
    };
    const [lineId] = map.Draw.add(line);

    map.directSelect(lineId, { coordPath: '1' });
    return map.awaitRender().then(() => {
      map.flushDrawEvents();
      map.drag([40, 20], [62, 42]);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.update'), {
        action: 'change_coordinates',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [[20, 0], [62, 42], [60, 40]]
          }
        }]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('add another vertex', t => {
  createTestMap().then(map => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[20, 0], [62, 42], [60, 40]]
      }
    };
    const [lineId] = map.Draw.add(line);

    map.directSelect(lineId);
    return map.awaitRender().then(() => {
      map.flushDrawEvents();
      map.click(41, 21);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.update'), {
        action: 'change_coordinates',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [[20, 0], [41, 21], [62, 42], [60, 40]]
          }
        }]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('delete a selected vertex with Backspace', t => {
  createTestMap().then(map => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[20, 0], [41, 21], [62, 42], [60, 40]]
      }
    };
    const [lineId] = map.Draw.add(line);

    map.directSelect(lineId, { coordPath: '1' });
    return map.awaitRender().then(() => {
      map.flushDrawEvents();
      map.backspace();
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.update'), {
        action: 'change_coordinates',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [[20, 0], [62, 42], [60, 40]]
          }
        }]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('start draw_line_string mode and drawing a line then finish with Enter', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.DRAW_LINE_STRING);
    map.click(240, 240);
    map.click(260, 260);
    map.enter();
    return map.awaitRender().then(() => {
      const line = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [[240, 240], [260, 260]]
        }
      };
      t.deepEqual(map.getEventData('draw.create'), {
        features: [line]
      });

      t.deepEqual(map.getEventData('draw.selectionchange'), {
        features: [line]
      });

      t.deepEqual(map.getEventData('draw.modechange'), {
        mode: 'simple_select'
      });

      t.deepEqual(map.flushDrawEvents(), [
        'draw.create',
        'draw.modechange',
        'draw.selectionchange'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('start draw_line_string mode then exit with Escape', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.DRAW_LINE_STRING);
    map.click(0, 0);
    map.click(20, 20);
    map.escape();
    return map.awaitRender().then(() => {
      t.deepEqual(map.getEventData('draw.modechange'), {
        mode: 'simple_select'
      });
      t.equal(map.Draw.getAll().features.length, 0, 'no feature created');
      t.deepEqual(map.flushDrawEvents(), [
        'draw.modechange'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});
