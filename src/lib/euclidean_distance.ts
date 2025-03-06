import type { XY } from '../types/types';

export const euclideanDistance = (a: XY, b: XY) => {
  const x = a.x - b.x;
  const y = a.y - b.y;
  return Math.sqrt(x * x + y * y);
};
