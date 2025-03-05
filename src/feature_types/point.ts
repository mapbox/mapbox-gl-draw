import Feature from './feature.js';
import type { DrawCTX, StrictFeature } from '../types/types';

type Coordinate = [number, number];

class Point extends Feature {
  coordinates: Coordinate;

  constructor(ctx: DrawCTX, geojson: StrictFeature) {
    super(ctx, geojson);
    this.coordinates = geojson.geometry.coordinates as Coordinate;
  }

  isValid(): boolean {
    return (
      typeof this.coordinates[0] === 'number' &&
      typeof this.coordinates[1] === 'number'
    );
  }

  updateCoordinate(pathOrLng: number, lngOrLat: number, lat?: number): void {
    if (lat !== undefined) {
      this.coordinates = [lngOrLat, lat];
    } else {
      this.coordinates = [pathOrLng, lngOrLat];
    }
    this.changed();
  }

  getCoordinate(): Coordinate {
    return this.getCoordinates() as Coordinate;
  }
}

export default Point;
