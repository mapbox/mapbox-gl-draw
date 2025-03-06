import Feature from './feature.js';
import type { Draw, Coords, StrictFeature } from '../types/types';

class Polygon extends Feature {
  constructor(ctx: Draw, geojson: StrictFeature) {
    super(ctx, geojson);

    // Ensure coordinates are properly typed and adjust them.
    this.coordinates = this.coordinates.map((ring: Coords) => ring.slice(0, -1));
  }

  isValid(): boolean {
    if (this.coordinates.length === 0) return false;
    return this.coordinates.every((ring: Coords) => ring.length > 2);
  }

  // Expects valid geoJSON polygon geometry: first and last positions must be equivalent.
  incomingCoords(coords: Coords): void {
    this.coordinates = coords.map(ring => ring.slice(0, -1));
    this.changed();
  }

  // Does NOT expect valid geoJSON polygon geometry: first and last positions should not be equivalent.
  setCoordinates(coords: Coords): void {
    this.coordinates = coords;
    this.changed();
  }

  addCoordinate(path: string, lng: number, lat: number): void {
    this.changed();
    const ids = path.split('.').map((x: string) => parseInt(x, 10));
    const ring = this.coordinates[ids[0]];
    ring.splice(ids[1], 0, [lng, lat]);
  }

  removeCoordinate(path: string): void {
    this.changed();
    const ids = path.split('.').map((x: string) => parseInt(x, 10));
    const ring = this.coordinates[ids[0]];
    if (ring) {
      ring.splice(ids[1], 1);
      if (ring.length < 3) {
        this.coordinates.splice(ids[0], 1);
      }
    }
  }

  getCoordinate(path: string): Coords {
    const ids = path.split('.').map((x: string) => parseInt(x, 10));
    const ring = this.coordinates[ids[0]];
    return JSON.parse(JSON.stringify(ring[ids[1]]));
  }

  getCoordinates(): Coords[] {
    return this.coordinates.map((coords: Coords) => coords.concat([coords[0]]));
  }

  updateCoordinate(path: string, lng: number, lat: number): void {
    this.changed();
    const parts = path.split('.');
    const ringId = parseInt(parts[0], 10);
    const coordId = parseInt(parts[1], 10);

    if (this.coordinates[ringId] === undefined) {
      this.coordinates[ringId] = [];
    }

    this.coordinates[ringId][coordId] = [lng, lat];
  }
}

export default Polygon;

