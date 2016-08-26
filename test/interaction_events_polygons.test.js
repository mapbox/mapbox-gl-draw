import test from 'tape';
import createTestMap from './utils/create_test_map';

test('enter draw_polygon mode by clicking the button', t => {
  createTestMap().then(map => {
    map.polygonButton.click();
    return map.awaitRender().then(() => {
      t.deepEqual(map.getEventData('draw.modechange'), {
        mode: map.Draw.modes.DRAW_POLYGON
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.modechange',
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('draw a polygon', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.DRAW_POLYGON);
    const polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 30], [30, 30], [30, 0], [0, 0]]]
      }
    };

    return map.awaitRender().then(() => {
      map.click(0, 0);
    }).then(map.awaitRender).then(() => {
      map.mousemove([0, 0], [0, 30]);
      map.click(0, 30);
    }).then(map.awaitRender).then(() => {
      map.mousemove([0, 30], [30, 30]);
      map.click(30, 30);
    }).then(map.awaitRender).then(() => {
      map.mousemove([30, 30], [30, 0]);
      map.click(30, 0);
    }).then(map.awaitRender).then(() => {
      map.mousemove([30, 0], [0, 0]);
      map.click(0, 0);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.create'), {
        features: [polygon]
      });
      t.deepEqual(map.getEventData('draw.modechange'), {
        mode: map.Draw.modes.SIMPLE_SELECT
      });
      t.deepEqual(map.getEventData('draw.selectionchange'), {
        features: [polygon]
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


test('select a polygon', t => {
  createTestMap().then(map => {
    const polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 30], [30, 30], [30, 0], [0, 0]]]
      }
    };
    map.Draw.add(polygon);

    return map.awaitRender().then(() => {
      map.click(10, 10);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.selectionchange'), {
        features: [polygon]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('deselect a polygon', t => {
  createTestMap().then(map => {
    const [polygonId] = map.Draw.add({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 30], [30, 30], [30, 0], [0, 0]]]
      }
    });

    map.select(polygonId);
    return map.awaitRender().then(() => {
      map.click(-10, -10);
    }).then(map.awaitRender).then(() => {
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

test('drag a polygon', t => {
  createTestMap().then(map => {
    const [polygonId] = map.Draw.add({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 30], [30, 30], [30, 0], [0, 0]]]
      }
    });

    map.select(polygonId);
    return map.awaitRender().then(() => {
      map.drag([10, 10], [-10, 30]);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.update'), {
        action: 'move',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[[-20, 20], [-20, 50], [10, 50], [10, 20], [-20, 20]]]
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
    const [polygonId] = map.Draw.add({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[-20, 20], [-20, 50], [10, 50], [10, 20], [-20, 20]]]
      }
    });

    map.select(polygonId);
    return map.awaitRender().then(() => {
      map.click(-20, 50);
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
    const [polygonId] = map.Draw.add({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[-20, 20], [-20, 50], [10, 50], [10, 20], [-20, 20]]]
      }
    });

    map.directSelect(polygonId, { coordPath: '0.1'});
    return map.awaitRender().then(() => {
      map.flushDrawEvents();
      map.drag([-20, 50], [-30, 40]);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.update'), {
        action: 'change_coordinates',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[[-20, 20], [-30, 40], [10, 50], [10, 20], [-20, 20]]]
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
    const polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[-20, 20], [-30, 40], [10, 50], [10, 20], [-20, 20]]]
      }
    };
    const [polygonId] = map.Draw.add(polygon);

    map.directSelect(polygonId);
    return map.awaitRender().then(() => {
      map.flushDrawEvents();
      map.click(10, 35);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.update'), {
        action: 'change_coordinates',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[[-20, 20], [-30, 40], [10, 50], [10, 35], [10, 20], [-20, 20]]]
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

test('drag multiple vertexes', t => {
  createTestMap().then(map => {
    const polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[-20, 20], [-30, 40], [10, 50], [10, 20], [-20, 20]]]
      }
    };
    const [polygonId] = map.Draw.add(polygon);

    map.select(polygonId);
    return map.awaitRender().then(() => {
      map.click(10, 20);
    }).then(map.awaitRender).then(() => {
      map.click(10, 50, { shiftKey: true });
    }).then(map.awaitRender).then(() => {
      map.flushDrawEvents();
      map.drag([10, 20], [20, 30]);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.update'), {
        action: 'change_coordinates',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[[-20, 20], [-30, 40], [20, 60], [20, 30], [-20, 20]]]
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
    const polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[-20, 20], [-30, 40], [10, 50], [10, 20], [-20, 20]]]
      }
    };
    const [polygonId] = map.Draw.add(polygon);

    map.directSelect(polygonId, { coordPath: '0.2' });
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
            type: 'Polygon',
            coordinates: [[[-20, 20], [-30, 40], [10, 20], [-20, 20]]]
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

test('start draw_polygon mode and drawing a polygon then finish with Enter', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.DRAW_POLYGON);
    map.click(240, 240);
    map.click(260, 260);
    map.click(300, 200);
    map.enter();
    return map.awaitRender().then(() => {
      const expectedPolygon = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[[240, 240], [260, 260], [300, 200], [240, 240]]]
        }
      };
      t.deepEqual(map.getEventData('draw.create'), {
        features: [expectedPolygon]
      });
      t.deepEqual(map.getEventData('draw.selectionchange'), {
        features: [expectedPolygon]
      });
      t.deepEqual(map.getEventData('draw.modechange'), {
        mode: map.Draw.modes.SIMPLE_SELECT
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

test('start draw_polygon mode then exit with Escape', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.DRAW_POLYGON);
    map.click(0, 0);
    map.click(20, 20);
    map.click(30, 30);
    map.escape();
    return map.awaitRender().then(() => {
      t.deepEqual(map.getEventData('draw.modechange'), {
        mode: map.Draw.modes.SIMPLE_SELECT
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
