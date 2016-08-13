import test from 'tape';
import createTestMap from './utils/create_test_map';

test('box-select a line and a polygon', t => {
  createTestMap().then(map => {
    const polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[-20, 20], [-30, 40], [10, 20], [-20, 20]]]
      }
    };
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[20, 0], [41, 21], [62, 42], [60, 40]]
      }
    };
    map.Draw.add(polygon);
    map.Draw.add(line);

    return map.awaitRender().then(() => {
      map.boxSelect([200, 200], [0, 0]);
    }).then(map.awaitRender).then(() => {
      const eventData = map.getEventData('draw.selectionchange');
      t.equal(eventData.features.length, 2);

      const selectedPolygon = eventData.features.find(feature => feature.geometry.type === 'Polygon');
      t.deepEqual(selectedPolygon, polygon);

      const selectedLineString = eventData.features.find(feature => feature.geometry.type === 'LineString');
      t.deepEqual(selectedLineString, line);

      t.deepEqual(map.flushDrawEvents(), [
        'draw.selectionchange'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('drag a line and a polygon', t => {
  createTestMap().then(map => {
    const polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[-20, 20], [-30, 40], [10, 20], [-20, 20]]]
      }
    };
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[20, 0], [41, 21], [62, 42], [60, 40]]
      }
    };
    const [polygonId] = map.Draw.add(polygon);
    const [lineId] = map.Draw.add(line);

    map.select([polygonId, lineId]);
    return map.awaitRender().then(() => {
      map.drag([-20, 30], [0, 50]);
    }).then(map.awaitRender).then(() => {
      const eventData = map.getEventData('draw.update');
      t.equal(eventData.action, 'move');
      t.equal(eventData.features.length, 2);

      const movedPolygon = eventData.features.find(feature => feature.geometry.type === 'Polygon');
      t.deepEqual(movedPolygon, {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 40], [-10, 60], [30, 40], [0, 40]]]
        }
      });

      const movedLine = eventData.features.find(feature => feature.geometry.type === 'LineString');
      t.deepEqual(movedLine, {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [[40, 20], [61, 41], [82, 62], [80, 60]]
        }
      });

      t.deepEqual(map.flushDrawEvents(), [
        'draw.update'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('box selection includes no features', t => {
  createTestMap().then(map => {
    map.Draw.changeMode(map.Draw.modes.SIMPLE_SELECT);
    map.boxSelect([200, 200], [0, 0]);
    return map.awaitRender().then(() => {
      t.deepEqual(map.flushDrawEvents(), [], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('build selection with shift+click', t => {
  createTestMap().then(map => {
    const polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[-20, 20], [-30, 40], [10, 20], [-20, 20]]]
      }
    };
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[20, 0], [41, 21], [62, 42], [60, 40]]
      }
    };
    const [polygonId] = map.Draw.add(polygon);
    map.Draw.add(line);

    map.select(polygonId);
    return map.awaitRender().then(() => {
      map.click(41, 21);
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
