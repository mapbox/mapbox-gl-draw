import Feature from './feature.js';
import type { FeatureCollection } from 'geojson';
import type { DrawCTX } from '../types/types';

const LineString = function (ctx: DrawCTX, geojson: FeatureCollection) {
  Feature.call(this, ctx, geojson);
};

LineString.prototype = Object.create(Feature.prototype);

LineString.prototype.isValid = function () {
  return this.coordinates.length > 1;
};

LineString.prototype.addCoordinate = function (path: string, lng: number, lat: number) {
  this.changed();
  const id = parseInt(path, 10);
  this.coordinates.splice(id, 0, [lng, lat]);
};

LineString.prototype.getCoordinate = function (path: string) {
  const id = parseInt(path, 10);
  return JSON.parse(JSON.stringify(this.coordinates[id]));
};

LineString.prototype.removeCoordinate = function (path: string) {
  this.changed();
  this.coordinates.splice(parseInt(path, 10), 1);
};

LineString.prototype.updateCoordinate = function (path: string, lng: number, lat: number) {
  const id = parseInt(path, 10);
  this.coordinates[id] = [lng, lat];
  this.changed();
};

export default LineString;
