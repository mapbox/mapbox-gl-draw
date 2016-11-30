import test from 'tape';
import getGeoJSON from './utils/get_geojson';
import createMockFeatureContext from './utils/create_mock_feature_context';
import Point from '../src/feature_types/point';
import LineString from '../src/feature_types/line_string';
import Polygon from '../src/feature_types/polygon';
import moveFeatures from '../src/lib/move_features';

const mockFeatureContext = createMockFeatureContext();

test('moveFeatures point', t => {
  const point = new Point(mockFeatureContext, getGeoJSON('point'));
  point.setCoordinates([10, 20]);
  moveFeatures([point], { lng: 7, lat: 13 });
  t.deepEqual(point.getCoordinates(), [17, 33]);
  t.end();
});

test('moveFeatures point beyond north limit map', t => {
  const point = new Point(mockFeatureContext, getGeoJSON('point'));
  point.setCoordinates([10, 20]);
  moveFeatures([point], { lng: 50, lat: 120 });
  t.deepEqual(point.getCoordinates(), [60, 85]);
  t.end();
});

test('moveFeatures point beyond south limit', t => {
  const point = new Point(mockFeatureContext, getGeoJSON('point'));
  point.setCoordinates([10, 20]);
  moveFeatures([point], { lng: -20, lat: -200 });
  t.deepEqual(point.getCoordinates(), [-10, -85]);
  t.end();
});

test('moveFeatures line', t => {
  const line = new LineString(mockFeatureContext, getGeoJSON('line'));
  line.setCoordinates([[10, 15], [-10, -30], [17, 33]]);
  moveFeatures([line], { lng: 7, lat: 13 });
  t.deepEqual(line.getCoordinates(),
    [[17, 28], [-3, -17], [24, 46]]
  );
  t.end();
});

test('moveFeatures line beyond north limit', t => {
  const line = new LineString(mockFeatureContext, getGeoJSON('line'));
  line.setCoordinates([[10, 15], [-10, -30], [17, 33]]);
  moveFeatures([line], { lng: 7, lat: 60 });
  t.deepEqual(line.getCoordinates(),
    [[17, 72], [-3, 27], [24, 90]],
    'lat should only move 57'
  );
  t.end();
});

test('moveFeatures line beyond south pole', t => {
  const line = new LineString(mockFeatureContext, getGeoJSON('line'));
  line.setCoordinates([[10, 15], [-10, -30], [17, 33]]);
  moveFeatures([line], { lng: -7, lat: -100 });
  t.deepEqual(line.getCoordinates(),
    [[3, -45], [-17, -90], [10, -27]],
    'lat should only move -45'
  );
  t.end();
});

test('moveFeatures polygon', t => {
  const polygon = new Polygon(mockFeatureContext, getGeoJSON('polygon'));
  polygon.setCoordinates([[[0, 0], [0, 10], [10, 10], [10, 0]]]);
  moveFeatures([polygon], { lng: -23, lat: 31.33 });
  t.deepEqual(polygon.getCoordinates(),
    [[[-23, 31.33], [-23, 41.33], [-13, 41.33], [-13, 31.33], [-23, 31.33]]]
  );
  t.end();
});


test('moveFeatures polygon beyond north limit', t => {
  const polygon = new Polygon(mockFeatureContext, getGeoJSON('polygon'));
  polygon.setCoordinates([[[0, 0], [0, 20], [10, 10], [10, 0]]]);
  moveFeatures([polygon], { lng: -0.5, lat: 100 });
  t.deepEqual(polygon.getCoordinates(),
    [[[-0.5, 70], [-0.5, 90], [9.5, 80], [9.5, 70], [-0.5, 70]]],
    'lat should only move 70'
  );
  t.end();
});

test('moveFeatures polygon beyond south pole', t => {
  const polygon = new Polygon(mockFeatureContext, getGeoJSON('polygon'));
  polygon.setCoordinates([[[0, 0], [0, -10.5], [10, -40], [10, 0]]]);
  moveFeatures([polygon], { lng: 1, lat: -80.44 });
  t.deepEqual(polygon.getCoordinates(),
    [[[1, -50], [1, -60.5], [11, -90], [11, -50], [1, -50]]],
    'lat should only move -50'
  );
  t.end();
});

test('moveFeatures multiple features', t => {
  const point = new Point(mockFeatureContext, getGeoJSON('point'));
  point.setCoordinates([10, 20]);
  const line = new LineString(mockFeatureContext, getGeoJSON('line'));
  line.setCoordinates([[10, 15], [-10, -30], [17, 33]]);
  const polygon = new Polygon(mockFeatureContext, getGeoJSON('polygon'));
  polygon.setCoordinates([[[0, 0], [0, 10], [10, 10], [10, 0]]]);
  moveFeatures([point, line, polygon], { lng: 5, lat: -7 });
  t.deepEqual(point.getCoordinates(), [15, 13], 'point moved');
  t.deepEqual(line.getCoordinates(),
    [[15, 8], [-5, -37], [22, 26]],
    'line moved'
  );
  t.deepEqual(polygon.getCoordinates(),
    [[[5, -7], [5, 3], [15, 3], [15, -7], [5, -7]]],
    'polygon moved'
  );
  t.end();
});

test('moveFeatures multiple features beyond north limit', t => {
  const point = new Point(mockFeatureContext, getGeoJSON('point'));
  point.setCoordinates([10, 45]);
  const line = new LineString(mockFeatureContext, getGeoJSON('line'));
  line.setCoordinates([[10, 15], [-10, -30], [17, 33]]);
  const polygon = new Polygon(mockFeatureContext, getGeoJSON('polygon'));
  polygon.setCoordinates([[[0, 0], [0, 10], [10, 10], [10, 0]]]);
  moveFeatures([point, line, polygon], { lng: 5, lat: 200 });
  t.deepEqual(point.getCoordinates(), [15, 85], 'point lat only moved 40');
  t.deepEqual(line.getCoordinates(),
    [[15, 55], [-5, 10], [22, 73]],
    'line lat only moved 40'
  );
  t.deepEqual(polygon.getCoordinates(),
    [[[5, 40], [5, 50], [15, 50], [15, 40], [5, 40]]],
    'polygon lat only moved 40'
  );
  t.end();
});

test('moveFeatures multiple features beyond south limit', t => {
  const point = new Point(mockFeatureContext, getGeoJSON('point'));
  point.setCoordinates([10, 20]);
  const line = new LineString(mockFeatureContext, getGeoJSON('line'));
  line.setCoordinates([[10, 15], [-10, -30], [17, 33]]);
  const polygon = new Polygon(mockFeatureContext, getGeoJSON('polygon'));
  polygon.setCoordinates([[[0, 0], [0, 10], [10, 10], [10, 0]]]);
  moveFeatures([point, line, polygon], { lng: 5, lat: -120 });
  t.deepEqual(point.getCoordinates(), [15, -40], 'point lat only moved -60');
  t.deepEqual(line.getCoordinates(),
    [[15, -45], [-5, -90], [22, -27]],
    'line lat only moved -60'
  );
  t.deepEqual(polygon.getCoordinates(),
    [[[5, -60], [5, -50], [15, -50], [15, -60], [5, -60]]],
    'polygon moved'
  );
  t.end();
});
