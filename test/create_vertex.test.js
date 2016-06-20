import test from 'tape';
import createVertex from '../src/lib/create_vertex';

test('createVertex', t => {
  t.deepEqual(createVertex('foo', [1, 2], '3.4.5', true), {
    type: 'Feature',
    properties: {
      meta: 'vertex',
      parent: 'foo',
      coord_path: '3.4.5',
      active: 'true'
    },
    geometry: {
      type: 'Point',
      coordinates: [1, 2]
    }
  });

  t.deepEqual(createVertex('bar', [99, 199], '1', false), {
    type: 'Feature',
    properties: {
      meta: 'vertex',
      parent: 'bar',
      coord_path: '1',
      active: 'false'
    },
    geometry: {
      type: 'Point',
      coordinates: [99, 199]
    }
  });

  t.end();
});
