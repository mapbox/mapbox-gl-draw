import test from 'tape';
import getGeoJSON from './utils/get_geojson';
import constrainFeatureMovement from '../src/lib/constrain_feature_movement';

test('constrainFeatureMovement point, no constraint', (t) => {
  const point = getGeoJSON('point');
  point.geometry.coordinates = [10, 20];
  const constrainedDelta = constrainFeatureMovement([point], {
    lat: 13,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 13,
    lng: 0
  });
  t.end();
});

test('constrainFeatureMovement point, requiring northern constraint', (t) => {
  const point = getGeoJSON('point');
  point.geometry.coordinates = [10, 20];
  const constrainedDelta = constrainFeatureMovement([point], {
    lat: 80,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 65,
    lng: 0
  }, 'stopped within projection');
  t.end();
});

test('constrainFeatureMovement point, requiring southern constraint', (t) => {
  const point = getGeoJSON('point');
  point.geometry.coordinates = [10, -20];
  const constrainedDelta = constrainFeatureMovement([point], {
    lat: -80,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: -65,
    lng: 0
  }, 'stopped within projection');
  t.end();
});

test('constrainFeatureMovement point, requiring western wrap', (t) => {
  const point = getGeoJSON('point');
  point.geometry.coordinates = [10, -20];
  const constrainedDelta = constrainFeatureMovement([point], {
    lat: 10,
    lng: -300
  });
  t.deepEqual(constrainedDelta, {
    lat: 10,
    lng: 60
  }, 'stopped within bounds');
  t.end();
});

test('constrainFeatureMovement point, requiring eastern wrap', (t) => {
  const point = getGeoJSON('point');
  point.geometry.coordinates = [10, 20];
  const constrainedDelta = constrainFeatureMovement([point], {
    lat: 10,
    lng: 300
  });
  t.deepEqual(constrainedDelta, {
    lat: 10,
    lng: -60
  }, 'stopped within bounds');
  t.end();
});

test('constrainFeatureMovement line, no constraint', (t) => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[0, 0], [10, 10], [20, 20]];
  const constrainedDelta = constrainFeatureMovement([line], {
    lat: 13,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 13,
    lng: 0
  });
  t.end();
});

test('constrainFeatureMovement line, requiring northern inner constraint', (t) => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[80, 80], [81, 81]];
  const constrainedDelta = constrainFeatureMovement([line], {
    lat: 7,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 5,
    lng: 0
  }, 'stopped within projection');
  t.end();
});

test('constrainFeatureMovement line, requiring northern outer constraint', (t) => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[30, 30], [81, 81]];
  const constrainedDelta = constrainFeatureMovement([line], {
    lat: 12,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 9,
    lng: 0
  }, 'stopped within poles');
  t.end();
});

test('constrainFeatureMovement line, requiring southern inner constraint', (t) => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[-80, -80], [-81, -81]];
  const constrainedDelta = constrainFeatureMovement([line], {
    lat: -7,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: -5,
    lng: 0
  }, 'stopped within projection');
  t.end();
});

test('constrainFeatureMovement line, requiring southern outer constraint', (t) => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[-30, -30], [-81, -81]];
  const constrainedDelta = constrainFeatureMovement([line], {
    lat: -12,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: -9,
    lng: 0
  }, 'stopped within poles');
  t.end();
});

test('constrainFeatureMovement line, requiring western wrap', (t) => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[0, 0], [10, 10], [20, 20]];
  const constrainedDelta = constrainFeatureMovement([line], {
    lat: 0,
    lng: -280
  });
  t.deepEqual(constrainedDelta, {
    lat: 0,
    lng: 80
  });
  t.end();
});

test('constrainFeatureMovement line, requiring eastern wrap', (t) => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[0, 0], [10, 10], [20, 20]];
  const constrainedDelta = constrainFeatureMovement([line], {
    lat: 0,
    lng: 255
  });
  t.deepEqual(constrainedDelta, {
    lat: 0,
    lng: -105
  });
  t.end();
});

test('constrainFeatureMovement polygon, no constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const constrainedDelta = constrainFeatureMovement([polygon], {
    lat: 13,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 13,
    lng: 0
  });
  t.end();
});

test('constrainFeatureMovement polygon, requiring northern inner constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[80, 80], [81, 81], [81, 82], [80, 80]];
  const constrainedDelta = constrainFeatureMovement([polygon], {
    lat: 7,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 5,
    lng: 0
  }, 'stopped within projection');
  t.end();
});

test('constrainFeatureMovement polygon, requiring northern outer constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[30, 30], [30, 40], [81, 81], [30, 30]];
  const constrainedDelta = constrainFeatureMovement([polygon], {
    lat: 12,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 9,
    lng: 0
  }, 'stopped within poles');
  t.end();
});

test('constrainFeatureMovement polygon, requiring southern inner constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[-80, -80], [-81, -81], [-81, -82], [-80, -80]];
  const constrainedDelta = constrainFeatureMovement([polygon], {
    lat: -7,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: -5,
    lng: 0
  }, 'stopped within projection');
  t.end();
});

test('constrainFeatureMovement polygon, requiring southern outer constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[-30, -30], [-30, -40], [-81, -81], [-30, -30]];
  const constrainedDelta = constrainFeatureMovement([polygon], {
    lat: -12,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: -9,
    lng: 0
  }, 'stopped within poles');
  t.end();
});

test('constrainFeatureMovement polygon, requiring western wrap', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const constrainedDelta = constrainFeatureMovement([polygon], {
    lat: 70,
    lng: -270
  });
  t.deepEqual(constrainedDelta, {
    lat: 70,
    lng: 90
  });
  t.end();
});

test('constrainFeatureMovement polygon, requiring eastern wrap', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const constrainedDelta = constrainFeatureMovement([polygon], {
    lat: 35,
    lng: 270
  });
  t.deepEqual(constrainedDelta, {
    lat: 35,
    lng: -90
  });
  t.end();
});

test('constrainFeatureMovement many features, no constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainFeatureMovement([polygon, point, line], {
    lat: 13,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 13,
    lng: 0
  });
  t.end();
});

test('constrainFeatureMovement many features, requiring northern inner constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[80, 80], [81, 81], [81, 82], [80, 80]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainFeatureMovement([polygon, point, line], {
    lat: 13,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 5,
    lng: 0
  }, 'stopped within projection');
  t.end();
});

test('constrainFeatureMovement many features, requiring northern outer constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainFeatureMovement([polygon, point, line], {
    lat: 100,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: 65,
    lng: 0
  }, 'stopped within poles');
  t.end();
});

test('constrainFeatureMovement many features, requiring southern inner constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[-80, -80], [-81, -81], [-81, -82], [-80, -80]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainFeatureMovement([polygon, point, line], {
    lat: -10,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: -5,
    lng: 0
  }, 'stopped within projection');
  t.end();
});

test('constrainFeatureMovement many features, requiring southern outer constraint', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainFeatureMovement([polygon, point, line], {
    lat: -200,
    lng: 0
  });
  t.deepEqual(constrainedDelta, {
    lat: -90,
    lng: 0
  }, 'stopped within poles');
  t.end();
});

test('constrainFeatureMovement many features, requiring western wrap', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainFeatureMovement([polygon, point, line], {
    lat: 27,
    lng: -310
  });
  t.deepEqual(constrainedDelta, {
    lat: 27,
    lng: 50
  });
  t.end();
});

test('constrainFeatureMovement many features, requiring eastern wrap', (t) => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainFeatureMovement([polygon, point, line], {
    lat: 27,
    lng: 260
  });
  t.deepEqual(constrainedDelta, {
    lat: 27,
    lng: -100
  });
  t.end();
});
