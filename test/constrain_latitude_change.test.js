import test from 'tape';
import getGeoJSON from './utils/get_geojson';
import constrainLatitudeChange from '../src/lib/constrain_latitude_change';

test('constrainLatitudeChange point, no constraint', t => {
  const point = getGeoJSON('point');
  point.geometry.coordinates = [10, 20];
  const constrainedDelta = constrainLatitudeChange([point], 13);
  t.equal(constrainedDelta, 13);
  t.end();
});

test('constrainLatitudeChange point, requiring northern constraint', t => {
  const point = getGeoJSON('point');
  point.geometry.coordinates = [10, 20];
  const constrainedDelta = constrainLatitudeChange([point], 80);
  t.equal(constrainedDelta, 65, 'stopped within projection');
  t.end();
});

test('constrainLatitudeChange point, requiring southern constraint', t => {
  const point = getGeoJSON('point');
  point.geometry.coordinates = [10, -20];
  const constrainedDelta = constrainLatitudeChange([point], -80);
  t.equal(constrainedDelta, -65, 'stopped within projection');
  t.end();
});

test('constrainLatitudeChange line, no constraint', t => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[0, 0], [10, 10], [20, 20]];
  const constrainedDelta = constrainLatitudeChange([line], 13);
  t.equal(constrainedDelta, 13);
  t.end();
});

test('constrainLatitudeChange line, requiring northern inner constraint', t => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[80, 80], [81, 81]];
  const constrainedDelta = constrainLatitudeChange([line], 7);
  t.equal(constrainedDelta, 5, 'stopped within projection');
  t.end();
});

test('constrainLatitudeChange line, requiring northern outer constraint', t => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[30, 30], [81, 81]];
  const constrainedDelta = constrainLatitudeChange([line], 12);
  t.equal(constrainedDelta, 9, 'stopped within poles');
  t.end();
});

test('constrainLatitudeChange line, requiring southern inner constraint', t => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[-80, -80], [-81, -81]];
  const constrainedDelta = constrainLatitudeChange([line], -7);
  t.equal(constrainedDelta, -5, 'stopped within projection');
  t.end();
});

test('constrainLatitudeChange line, requiring southern outer constraint', t => {
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[-30, -30], [-81, -81]];
  const constrainedDelta = constrainLatitudeChange([line], -12);
  t.equal(constrainedDelta, -9, 'stopped within poles');
  t.end();
});

test('constrainLatitudeChange polygon, no constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const constrainedDelta = constrainLatitudeChange([polygon], 13);
  t.equal(constrainedDelta, 13);
  t.end();
});

test('constrainLatitudeChange polygon, requiring northern inner constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[80, 80], [81, 81], [81, 82], [80, 80]];
  const constrainedDelta = constrainLatitudeChange([polygon], 7);
  t.equal(constrainedDelta, 5, 'stopped within projection');
  t.end();
});

test('constrainLatitudeChange polygon, requiring northern outer constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[30, 30], [30, 40], [81, 81], [30, 30]];
  const constrainedDelta = constrainLatitudeChange([polygon], 12);
  t.equal(constrainedDelta, 9, 'stopped within poles');
  t.end();
});

test('constrainLatitudeChange polygon, requiring southern inner constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[-80, -80], [-81, -81], [-81, -82], [-80, -80]];
  const constrainedDelta = constrainLatitudeChange([polygon], -7);
  t.equal(constrainedDelta, -5, 'stopped within projection');
  t.end();
});

test('constrainLatitudeChange polygon, requiring southern outer constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[-30, -30], [-30, -40], [-81, -81], [-30, -30]];
  const constrainedDelta = constrainLatitudeChange([polygon], -12);
  t.equal(constrainedDelta, -9, 'stopped within poles');
  t.end();
});

test('constrainLatitudeChange many features, no constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainLatitudeChange([polygon, point, line], 13);
  t.equal(constrainedDelta, 13);
  t.end();
});

test('constrainLatitudeChange many features, requiring northern inner constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[80, 80], [81, 81], [81, 82], [80, 80]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainLatitudeChange([polygon, point, line], 13);
  t.equal(constrainedDelta, 5, 'stopped within projection');
  t.end();
});

test('constrainLatitudeChange many features, requiring northern outer constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainLatitudeChange([polygon, point, line], 100);
  t.equal(constrainedDelta, 65, 'stopped within poles');
  t.end();
});

test('constrainLatitudeChange many features, requiring southern inner constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[-80, -80], [-81, -81], [-81, -82], [-80, -80]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainLatitudeChange([polygon, point, line], -10);
  t.equal(constrainedDelta, -5, 'stopped within projection');
  t.end();
});

test('constrainLatitudeChange many features, requiring southern outer constraint', t => {
  const polygon = getGeoJSON('polygon');
  polygon.geometry.coordinates = [[0, 0], [10, 10], [20, 20], [0, 0]];
  const point = getGeoJSON('point');
  point.geometry.coordinates = [15, 15];
  const line = getGeoJSON('line');
  line.geometry.coordinates = [[15, 15], [25, 25]];
  const constrainedDelta = constrainLatitudeChange([polygon, point, line], -200);
  t.equal(constrainedDelta, -90, 'stopped within poles');
  t.end();
});
