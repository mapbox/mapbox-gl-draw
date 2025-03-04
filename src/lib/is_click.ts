import { euclideanDistance } from './euclidean_distance.js';
import type { Entry } from '../types/types';

interface Options {
  fineTolerance: number;
  grossTolerance: number;
  interval: number;
}

export default function isClick(start: Entry, end: Entry, {
  fineTolerance = 4,
  grossTolerance = 12,
  interval = 500
}: Options) {
  start.point = start.point || end.point;
  start.time = start.time || end.time;
  const moveDistance = euclideanDistance(start.point, end.point);

  return (
    moveDistance < fineTolerance ||
    (moveDistance < grossTolerance && end.time - start.time < interval)
  );
}
