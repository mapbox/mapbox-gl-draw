import { generateID } from '../lib/id';
import Feature from './feature';
import * as Constants from '../constants';

import MultiPoint from './point';
import MultiLineString from './line_string';
import MultiPolygon from './polygon';

const models = {
  MultiPoint,
  MultiLineString,
  MultiPolygon
};

type FeatureType = MultiPoint | MultiLineString | MultiPolygon;

const takeAction = (
  features: FeatureType[],
  action:
    | 'getCoordinate'
    | 'updateCoordinate'
    | 'addCoordinate'
    | 'removeCoordinate',
  path: string,
  lng?: number,
  lat?: number
): any => {
  const parts = path.split('.');
  const idx = parseInt(parts[0], 10);
  const tail = !parts[1] ? null : parts.slice(1).join('.');
  return features[idx][action](tail, lng, lat);
};

class MultiFeature extends Feature {
  model: FeatureType;
  features: FeatureType[];

  constructor(ctx: any, geojson: any) {
    super(ctx, geojson);

    delete this.coordinates;

    // Determine the model based on geojson type
    this.model = models[geojson.geometry.type];
    if (this.model === undefined) {
      throw new TypeError(`${geojson.geometry.type} is not a valid type`);
    }

    // Initialize features
    this.features = this._coordinatesToFeatures(geojson.geometry.coordinates);
  }

  private _coordinatesToFeatures(coordinates: any[]): FeatureType[] {
    const Model = this.model.bind(this);
    return coordinates.map(
      coords =>
        new Model(this.ctx, {
          id: generateID(),
          type: Constants.geojsonTypes.FEATURE,
          properties: {},
          geometry: {
            coordinates: coords,
            type: this.type.replace('Multi', '')
          }
        })
    );
  }

  isValid(): boolean {
    return this.features.every(f => f.isValid());
  }

  setCoordinates(coords: any[]): void {
    this.features = this._coordinatesToFeatures(coords);
    this.changed();
  }

  getCoordinate(path: string): any {
    return takeAction(this.features, 'getCoordinate', path);
  }

  getCoordinates(): any[] {
    return JSON.parse(
      JSON.stringify(
        this.features.map(f => {
          if (f.type === Constants.geojsonTypes.POLYGON) {
            return f.getCoordinates();
          }
          return f.coordinates;
        })
      )
    );
  }

  updateCoordinate(path: string, lng: number, lat: number): void {
    takeAction(this.features, 'updateCoordinate', path, lng, lat);
    this.changed();
  }

  addCoordinate(path: string, lng: number, lat: number): void {
    takeAction(this.features, 'addCoordinate', path, lng, lat);
    this.changed();
  }

  removeCoordinate(path: string): void {
    takeAction(this.features, 'removeCoordinate', path);
    this.changed();
  }

  getFeatures(): FeatureType[] {
    return this.features;
  }
}

export default MultiFeature;
