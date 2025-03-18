import Feature from './feature.js';
import type { CTX, StrictFeature } from '../types/types';

class Point extends Feature {
  constructor(ctx: CTX, geojson: StrictFeature) {
    super(ctx, geojson);
    this.coordinates = geojson.geometry.coordinates;
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

  getCoordinate() {
    return this.getCoordinates();
  }
}

export default Point;
