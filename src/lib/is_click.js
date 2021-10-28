import euclideanDistance from './euclidean_distance';

const TOLERANCE = 12;
const INTERVAL = 500;

export default function isClick(start, end, options = {}) {
  const tolerance = options.tolerance || TOLERANCE;
  const interval = options.interval || INTERVAL;

  const startPoint = start.point || end.point;
  const distance = euclideanDistance(startPoint, end.point);

  const startTime = start.time || end.time;
  const duration = end.time - startTime;

  return distance < tolerance && duration < interval;
}
