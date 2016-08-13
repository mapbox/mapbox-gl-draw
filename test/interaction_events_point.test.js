import test from 'tape';
import createTestMap from './utils/create_test_map';

test('enter draw_point mode by clicking the button', t => {
  createTestMap().then(map => {
    map.pointButton.click();

    t.deepEqual(map.getEventData('draw.modechange'), {
      mode: map.Draw.modes.DRAW_POINT
    });
    t.deepEqual(map.flushDrawEvents(), ['draw.modechange'], 'no unexpected draw events');
    map.destroy();
    t.end();
  }).catch(t.end);
});

test('create a point', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.DRAW_POINT);
    const point = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [25, 25]
      }
    };

    map.click(25, 25);
    return map.awaitRender().then(() => {
      t.deepEqual(map.getEventData('draw.create'), {
        features: [point]
      });
      t.deepEqual(map.getEventData('draw.modechange'), {
        mode: 'simple_select'
      });
      t.deepEqual(map.getEventData('draw.selectionchange'), {
        features: [point]
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

test('select a point', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.SIMPLE_SELECT);

    const point = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [25, 25]
      }
    };
    map.Draw.add(point);

    return map.awaitRender().then(() => {
      map.click(25, 25);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.selectionchange'), {
        features: [point]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('deselect a selected point', t => {
  createTestMap().then(map => {
    const point = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [25, 25]
      }
    };
    const [pointId] = map.Draw.add(point);

    map.select(pointId);
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

test('drag a point', t => {
  createTestMap().then(map => {
    const point = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [25, 25]
      }
    };
    const [pointId] = map.Draw.add(point);

    map.select(pointId);
    return map.awaitRender().then(() => {
      map.drag([25, 25], [35, 10]);
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.update'), {
        action: 'move',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [35, 10]
            }
          }
        ]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('delete a point with the Trash button', t => {
  createTestMap().then(map => {
    const point = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [25, 25]
      }
    };
    const [pointId] = map.Draw.add(point);

    map.select(pointId);
    return map.awaitRender().then(() => {
      map.trashButton.click();
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.delete'), {
        features: [point]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.delete'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('start draw_point mode then exit with Enter', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.DRAW_POINT);
    map.enter();
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

test('start draw_point mode then exit with Escape', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.DRAW_POINT);
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
