import euclideanDistance from './euclidean_distance';

export const TAP_TOLERANCE = 25;
export const TAP_INTERVAL = 250;

export default function isTap(start, end, options = {}) {
  const tolerance = options.tolerance || TAP_TOLERANCE;
  const interval = options.interval || TAP_INTERVAL;

  const startPoint = start.point || end.point;
  const distance = euclideanDistance(startPoint, end.point);

  const startTime = start.time || end.time;
  const duration = end.time - startTime;

  return distance < tolerance && duration < interval;
}
