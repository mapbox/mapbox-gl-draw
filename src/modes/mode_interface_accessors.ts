import * as Constants from '../constants';
import * as featuresAt from '../lib/features_at';
import Point from '../feature_types/point';
import LineString from '../feature_types/line_string';
import Polygon from '../feature_types/polygon';
import MultiFeature from '../feature_types/multi_feature';
import type { CTX, DrawOptions, StrictFeature } from '../types/types';
import type { Map } from 'mapbox-gl';

type DrawFeature = Point | LineString | Polygon | MultiFeature;

interface SelectedCoordinate {
  coord_path: string;
  feature_id: string;
}

interface DrawActions {
  trash?: boolean;
  combineFeatures?: boolean;
  uncombineFeatures?: boolean;
}

export default class ModeInterface {
  map: Map;
  drawConfig: DrawOptions;
  private _ctx: CTX;

  constructor(ctx: CTX) {
    this.map = ctx.map;
    this.drawConfig = { ...ctx.options };
    this._ctx = ctx;
  }

  setSelected(features: DrawFeature[]): void {
    this._ctx.store.setSelected(features);
  }

  setSelectedCoordinates(coords: SelectedCoordinate[]): void {
    this._ctx.store.setSelectedCoordinates(coords);
    coords.reduce(
      (m, c) => {
        if (!m[c.feature_id]) {
          m[c.feature_id] = true;
          this._ctx.store.get(c.feature_id)?.changed();
        }
        return m;
      },
      {} as Record<string, boolean>
    );
  }

  getSelected(): DrawFeature[] {
    return this._ctx.store.getSelected();
  }

  getSelectedIds(): string[] {
    return this._ctx.store.getSelectedIds();
  }

  isSelected(id: string): boolean {
    return this._ctx.store.isSelected(id);
  }

  getFeature(id: string): DrawFeature | undefined {
    return this._ctx.store.get(id);
  }

  select(id: string): void {
    this._ctx.store.select(id);
  }

  deselect(id: string): void {
    this._ctx.store.deselect(id);
  }

  deleteFeature(id: string, opts: Record<string, any> = {}): void {
    this._ctx.store.delete(id, opts);
  }

  addFeature(feature: DrawFeature, opts: Record<string, any> = {}): void {
    this._ctx.store.add(feature, opts);
  }

  clearSelectedFeatures(): void {
    this._ctx.store.clearSelected();
  }

  clearSelectedCoordinates(): void {
    this._ctx.store.clearSelectedCoordinates();
  }

  setActionableState({
    trash,
    combineFeatures,
    uncombineFeatures
  }: DrawActions): void {
    this._ctx.events.actionable({
      trash: trash || false,
      combineFeatures: combineFeatures || false,
      uncombineFeatures: uncombineFeatures || false
    });
  }

  changeMode(
    mode: string,
    opts: Record<string, any> = {},
    eventOpts: Record<string, any> = {}
  ): void {
    this._ctx.events.changeMode(mode, opts, eventOpts);
  }

  fire(eventName: string, eventData: any): void {
    this._ctx.events.fire(eventName, eventData);
  }

  updateUIClasses(opts: Record<string, any>): void {
    this._ctx.ui.queueMapClasses(opts);
  }

  activateUIButton(name?: string): void {
    this._ctx.ui.setActiveButton(name);
  }

  featuresAt(
    event: any,
    bbox: any,
    bufferType: 'click' | 'touch' = 'click'
  ): any {
    if (bufferType !== 'click' && bufferType !== 'touch') {
      throw new Error('invalid buffer type');
    }
    return featuresAt[bufferType](event, bbox, this._ctx);
  }

  newFeature(geojson: StrictFeature): DrawFeature {
    const type = geojson.geometry.type;
    if (type === Constants.geojsonTypes.POINT)
      return new Point(this._ctx, geojson);
    if (type === Constants.geojsonTypes.LINE_STRING)
      return new LineString(this._ctx, geojson);
    if (type === Constants.geojsonTypes.POLYGON)
      return new Polygon(this._ctx, geojson);
    return new MultiFeature(this._ctx, geojson);
  }

  isInstanceOf(type: string, feature: any): boolean {
    if (type === Constants.geojsonTypes.POINT) return feature instanceof Point;
    if (type === Constants.geojsonTypes.LINE_STRING)
      return feature instanceof LineString;
    if (type === Constants.geojsonTypes.POLYGON)
      return feature instanceof Polygon;
    if (type === 'MultiFeature') return feature instanceof MultiFeature;
    throw new Error(`Unknown feature class: ${type}`);
  }

  doRender(id: string): void {
    this._ctx.store.featureChanged(id);
  }
}
