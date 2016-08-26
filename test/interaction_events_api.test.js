import test from 'tape';
import createTestMap from './utils/create_test_map';

test('API usage does not trigger events', t => {
  createTestMap().then(map => {
    map.Draw.add({
      type: 'Feature',
      id: 'point',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [10, 10]
      }
    });
    map.Draw.add({
      type: 'Feature',
      id: 'line',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[10, 10], [20, 20]]
      }
    });
    map.Draw.changeMode('draw_point');
    map.Draw.changeMode('draw_line_string');
    map.Draw.changeMode('draw_polygon');
    map.Draw.changeMode('simple_select');
    map.Draw.delete('point');
    return map.awaitRender().then(() => {
      t.deepEqual(map.flushDrawEvents(), [], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});

test('except when the API function does not directly correspond to the event', t => {
  createTestMap().then(map => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[10, 10], [20, 20], [30, 30]]
      }
    };
    const lineId = map.Draw.add(line)[0];
    map.Draw.changeMode('simple_select', {
      featureIds: [lineId]
    });
    return map.awaitRender().then(() => {
      map.Draw.trash();
    }).then(map.awaitRender).then(() => {
      t.deepEqual(map.getEventData('draw.delete'), {
        features: [line]
      });
      t.deepEqual(map.flushDrawEvents(), [
        'draw.delete'
      ], 'no unexpected draw events');
      map.destroy();
      t.end();
    });
  }).catch(t.end);
});
