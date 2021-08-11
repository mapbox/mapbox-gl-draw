import euclideanDistance from './euclidean_distance';

export const TAP_TOLERANCE = 25;
export const TAP_INTERVAL = 250;

export default function isTap(start, end, options = {}) {
  const tolerance = (options.tolerance != null) ? options.tolerance : TAP_TOLERANCE;
  const interval = (options.interval != null) ? options.interval : TAP_INTERVAL;

  start.point = start.point || end.point;
  start.time = start.time || end.time;
  const moveDistance = euclideanDistance(start.point, end.point);

  return moveDistance < tolerance && (end.time - start.time) < interval;
}
