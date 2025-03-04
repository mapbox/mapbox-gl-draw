import { euclideanDistance } from './euclidean_distance.js';
import type { Entry } from '../types/types';

interface Options {
  tolerance: number;
  interval: number;
}

export const isTap = (start: Entry, end: Entry, {
  tolerance = 25,
  interval = 250
}: Options) => {
  start.point = start.point || end.point;
  start.time = start.time || end.time;
  const moveDistance = euclideanDistance(start.point, end.point);
  return moveDistance < tolerance && end.time - start.time < interval;
}
