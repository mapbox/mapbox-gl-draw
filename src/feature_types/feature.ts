import { generateID } from '../lib/id';
import * as Constants from '../constants';
import type { Geometry } from 'geojson';
import type { StrictFeature, DrawCTX } from '../types/types';

class Feature {
  protected ctx: DrawCTX;
  properties: Record<string, any>;
  coordinates: any;
  id: string;
  type: Geometry['type'];

  constructor(ctx: DrawCTX, geojson: StrictFeature) {
    this.ctx = ctx;
    this.properties = geojson.properties || {};
    this.coordinates = geojson.geometry.coordinates;
    this.id = (geojson as any).id || generateID();
    this.type = geojson.geometry.type;
  }

  changed(): void {
    this.ctx.store.featureChanged(this.id);
  }

  incomingCoords(coords: any): void {
    this.setCoordinates(coords);
  }

  setCoordinates(coords: any): void {
    this.coordinates = coords;
    this.changed();
  }

  getCoordinates(): any {
    return JSON.parse(JSON.stringify(this.coordinates));
  }

  setProperty(property: string, value: any): void {
    this.properties[property] = value;
  }

  toGeoJSON(): any {
    return {
      id: this.id,
      type: Constants.geojsonTypes.FEATURE,
      properties: this.properties,
      geometry: {
        coordinates: this.getCoordinates(),
        type: this.type
      }
    };
  }

  internal(mode: string): any {
    const properties: Record<string, any> = {
      id: this.id,
      meta: Constants.meta.FEATURE,
      'meta:type': this.type,
      active: Constants.activeStates.INACTIVE,
      mode
    };

    if (this.ctx.options.userProperties) {
      for (const name in this.properties) {
        properties[`user_${name}`] = this.properties[name];
      }
    }

    return {
      type: Constants.geojsonTypes.FEATURE,
      properties,
      geometry: {
        coordinates: this.getCoordinates(),
        type: this.type
      }
    };
  }
}

export default Feature;

