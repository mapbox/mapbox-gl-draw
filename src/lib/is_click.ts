import { euclideanDistance } from './euclidean_distance.js';
import type { Entry } from '../types/types';

interface Options {
  fineTolerance: number;
  grossTolerance: number;
  interval: number;
}

export default function isClick(
  start: Entry, 
  end: Entry, 
  options: Partial<Options> = {}
) {
  const {
    fineTolerance = 4,
    grossTolerance = 12,
    interval = 500
  } = options;

  const adjustedStart = {
    point: start.point || end.point,
    time: start.time || end.time
  };

  if (adjustedStart.time === undefined || end.time === undefined) {
    return false;
  }

  const moveDistance = euclideanDistance(adjustedStart.point, end.point);

  return (
    moveDistance < fineTolerance ||
    (moveDistance < grossTolerance && end.time - adjustedStart.time < interval)
  );
}

