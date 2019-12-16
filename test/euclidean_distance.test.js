import test from 'tape';
import euclideanDistance from '../src/lib/euclidean_distance';

test('euclideanDistance', (t) => {
  t.equal(euclideanDistance({ x: 1, y: 1 }, { x: 4, y: 4 }), 4.242640687119285);
  t.equal(euclideanDistance({ x: -10, y: 99.486354 }, { x: 0, y: -0.324736 }), 100.31078549681536);
  t.end();
});
