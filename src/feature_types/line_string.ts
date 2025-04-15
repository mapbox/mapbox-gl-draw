import Feature from './feature.js';
import type { StrictFeature, CTX } from '../types/types';

type Coordinate = [number, number];

class LineString extends Feature {
  constructor(ctx: CTX, geojson: StrictFeature) {
    super(ctx, geojson);
  }

  isValid(): boolean {
    return this.coordinates.length > 1;
  }

  addCoordinate(path: string | number, lng: number, lat: number): void {
    this.changed();
    const id = parseInt(path as string, 10);
    this.coordinates.splice(id, 0, [lng, lat]);
  }

  getCoordinate(path: string | number): Coordinate | undefined {
    const id = parseInt(path as string, 10);
    return this.coordinates[id]
      ? [...(this.coordinates[id] as Coordinate)]
      : undefined;
  }

  removeCoordinate(path: string | number): void {
    this.changed();
    this.coordinates.splice(parseInt(path as string, 10), 1);
  }

  updateCoordinate(path: string | number, lng: number, lat: number): void {
    const id = parseInt(path as string, 10);
    this.coordinates[id] = [lng, lat];
    this.changed();
  }
}

export default LineString;
