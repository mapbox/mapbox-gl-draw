import test from 'tape';
import getGeoJSON from './utils/get_geojson';
import getEdgeLatitudes from '../src/lib/get_edge_latitudes';

test('getEdgeLatitudes Point', t => {
  const pointA = getGeoJSON('point');
  pointA.geometry.coordinates = [13, 86];
  t.deepEqual(getEdgeLatitudes(pointA), {
    north: 86,
    south: 86
  });

  const pointB = getGeoJSON('point');
  pointB.geometry.coordinates = [13, -86];
  t.deepEqual(getEdgeLatitudes(pointB), {
    north: -86,
    south: -86
  });

  t.end();
});

test('getEdgeLatitudes LineString', t => {
  const lineA = getGeoJSON('line');
  lineA.geometry.coordinates = [[0,0], [1, 13], [2, 6], [12, -30]];
  t.deepEqual(getEdgeLatitudes(lineA), {
    north: 13,
    south: -30
  });

  const lineB = getGeoJSON('line');
  lineB.geometry.coordinates = [
    [14.192951022519537, -30.21842686094731],
    [-15.528758177580215, -17.424477253521303],
    [-0.8348794719128705, 7.657988114321057],
    [36.23376908102051, -0.6678884513233498],
    [32.23965635284176, 13.849187186638147],
    [10.198838294341016, 19.28823662676227],
    [-31.87908709006996, 7.618416163904087],
    [-33.54884603389564, -30.252921566745542],
    [-15.84940122934205, -43.78379472991321],
    [31.23780098654626, -44.97712732309387],
    [39.58659570567542, -21.863899380493166],
    [28.566186676425048, -11.31991684210216],
    [45.93167969221355, 3.2977693584946053],
    [43.59401717085743, 23.943549045932485],
    [23.222958056182392, 28.436833477423704]
  ];
  t.deepEqual(getEdgeLatitudes(lineB), {
    north: 28.436833477423704,
    south: -44.97712732309387
  });

  t.end();
});

test('getEdgeLatitudes Polygon', t => {
  const polygonA = getGeoJSON('line');
  polygonA.geometry.coordinates = [[
    [-33.88279782266076, -20.30599627308044],
    [-41.22973717549442, 1.295770474329359],
    [-32.54699066760017, 25.460451288809963],
    [0.1802846313858879, 36.052845219612166],
    [24.892717000008076, -11.64718307037542],
    [-25.53400310353183, -63.04951993874053],
    [-33.88279782266076, -20.30599627308044]
  ]]
  t.deepEqual(getEdgeLatitudes(polygonA), {
    north: 36.052845219612166,
    south: -63.04951993874053
  });

  t.end();
})
