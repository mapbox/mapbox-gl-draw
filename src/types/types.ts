import { modes, meta, types } from '../constants';
import type { ControlPosition, IControl, Map, Layer } from 'mapbox-gl';
import type { FeatureCollection, Feature, Point, Geometry } from 'geojson';

export interface DrawOptions {
  keybindings: boolean;
  touchEnabled: boolean;
  boxSelect: boolean;
  clickBuffer: number;
  touchBuffer: number;
  controls: Controls;
  displayControlsDefault: boolean;
  styles: Array<DrawLayer>
}

export interface Controls {
  point: boolean;
  line_string: boolean;
  polygon: boolean;
  trash: boolean;
  combine_features: boolean
  uncombine_features: boolean
}

type Modes = typeof modes;

export interface DrawLayer extends Layer {
  meta: typeof meta;
  mode: Modes;
  active: boolean;
}

export declare class Draw implements IControl {
  options: DrawOptions;
  types: typeof types;
  modes: Modes;
  getDefaultPosition: () => ControlPosition;
  constructor(options?: DrawOptions);
  add(geojson: Feature | FeatureCollection | Geometry): string[];
  get(featureId: string): Feature | undefined;
  getFeatureIdsAt(point: { x: number; y: number }): string[];
  getSelectedIds(): string[];
  getSelected(): FeatureCollection;
  getSelectedPoints(): FeatureCollection;
  getAll(): FeatureCollection;
  delete(ids: string | string[]): this;
  deleteAll(): this;
  set(featureCollection: FeatureCollection): string[];
  trash(): this;
  combineFeatures(): this;
  uncombineFeatures(): this;
  getMode(): (Modes & {}) | string;
  changeMode(mode: typeof modes['SIMPLE_SELECT'], options?: { featureIds: string[] }): this;
  changeMode(mode: typeof modes['DIRECT_SELECT'], options: { featureId: string }): this;
  changeMode(
    mode: typeof modes['DRAW_LINE_STRING'],
    options?: { featureId: string; from: Feature<Point> | Point | number[] },
  ): this;
  changeMode(mode: Modes): this;
  changeMode<T extends string>(mode: T & (T extends Modes ? never : T), options?: object): this;
  setFeatureProperty(featureId: string, property: string, value: any): this;
  onAdd(map: Map): HTMLElement;
  onRemove(map: Map): unknown;
}
