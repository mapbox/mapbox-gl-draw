const euclideanDistance = require('./euclidean_distance');

const TOLERANCE = 25;
const INTERVAL = 250;

module.exports = function isTap(start, end, options = {}) {
  const tolerance = (options.tolerance != null) ? options.tolerance : TOLERANCE;
  const interval = (options.interval != null) ? options.interval : INTERVAL;

  start.point = start.point || end.point;
  start.time = start.time || end.time;
  const moveDistance = euclideanDistance(start.point, end.point);

  return moveDistance < tolerance && (end.time - start.time) < interval;
};
