import { euclideanDistance } from './euclidean_distance.js';
import type { Entry } from '../types/types';

interface Options {
  tolerance?: number;
  interval?: number;
}

export const TAP_TOLERANCE = 25;
export const TAP_INTERVAL = 250;

export const isTap = (
  start: Entry,
  end: Entry,
  options: Options = {}
): boolean => {
  const { tolerance = TAP_TOLERANCE, interval = TAP_INTERVAL } = options;

  start.point = start.point || end.point;
  start.time = start.time || end.time;
  const moveDistance = euclideanDistance(start.point, end.point);

  return moveDistance < tolerance && end.time - start.time < interval;
};

