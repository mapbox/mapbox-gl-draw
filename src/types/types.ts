import { modes, meta, types } from '../constants';
import {
  BBox,
  Feature,
  FeatureCollection,
  GeoJSON,
  GeoJsonTypes,
  Geometry,
  Point,
  Position
} from 'geojson';
import type {
  ControlPosition,
  IControl,
  Map,
  Layer,
  MapMouseEvent as MapboxMapMouseEvent,
  MapTouchEvent as MapboxMapTouchEvent
} from 'mapbox-gl';

// Extend Feature to require geometry and properties
export interface StrictFeature extends Omit<Feature, 'geometry' | 'properties'> {
  geometry: Geometry & { coordinates: unknown };
  properties: Record<string, unknown>;
}

// Extend FeatureCollection to use StrictFeature
export interface StrictFeatureCollection extends Omit<FeatureCollection, 'features'> {
  features: StrictFeature[];
}

// Example usage
export type XY = { x: number, y: number };

export type Coords = Array<[number, number]>;

export interface Entry {
  point: XY;
  time: number;
}

export interface MapMouseEvent extends MapboxMapMouseEvent {
  featureTarget: DrawFeature;
}

export interface MapTouchEvent extends MapboxMapTouchEvent {
  featureTarget: DrawFeature;
}

export interface DrawOptions {
  keybindings: boolean;
  touchEnabled: boolean;
  boxSelect: boolean;
  clickBuffer: number;
  touchBuffer: number;
  controls: Controls;
  displayControlsDefault: boolean;
  styles: Array<DrawLayer>;
}

export interface Controls {
  point: boolean;
  line_string: boolean;
  polygon: boolean;
  trash: boolean;
  combine_features: boolean;
  uncombine_features: boolean;
}

type Modes = typeof modes;

export interface DrawLayer extends Layer {
  meta: typeof meta;
  mode: Modes;
  active: boolean;
}

interface DrawPoint extends DrawFeatureBase<Position> {
  readonly type: 'Point';
  getCoordinate(): Position;
  updateCoordinate(lng: number, lat: number): void;
  updateCoordinate(path: string, lng: number, lat: number): void;
}

interface DrawLineString extends DrawFeatureBase<Position[]> {
  readonly type: 'LineString';
  addCoordinate(path: string | number, lng: number, lat: number): void;
  removeCoordinate(path: string | number): void;
}

interface DrawPolygon extends DrawFeatureBase<Position[][]> {
  readonly type: 'Polygon';
  addCoordinate(path: string, lng: number, lat: number): void;
  removeCoordinate(path: string): void;
}

interface DrawFeatureBase<Coordinates> {
  readonly properties: Readonly<Feature['properties']>;
  readonly coordinates: Coordinates;
  readonly id: NonNullable<Feature['id']>;
  readonly type: GeoJsonTypes;

  changed(): void;
  isValid(): boolean;
  incomingCoords: this['setCoordinates'];
  setCoordinates(coords: Coordinates): void;
  getCoordinates(): Coordinates;
  getCoordinate(path: string): Position;
  updateCoordinate(path: string, lng: number, lat: number): void;
  setProperty(property: string, value: any): void;
  toGeoJSON(): GeoJSON;
}

interface DrawMultiFeature<
  Type extends 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'
> extends Omit<
    DrawFeatureBase<
      | (Type extends 'MultiPoint' ? Array<DrawPoint['coordinates']> : never)
      | (Type extends 'MultiLineString'
          ? Array<DrawLineString['coordinates']>
          : never)
      | (Type extends 'MultiPolygon'
          ? Array<DrawPolygon['coordinates']>
          : never)
    >,
    'coordinates'
  > {
  readonly type: Type;
  readonly features: Array<
    | (Type extends 'MultiPoint' ? DrawPoint : never)
    | (Type extends 'MultiLineString' ? DrawLineString : never)
    | (Type extends 'MultiPolygon' ? DrawPolygon : never)
  >;
  getFeatures(): this['features'];
}

type DrawFeature =
  | DrawPoint
  | DrawLineString
  | DrawPolygon
  | DrawMultiFeature<'MultiPoint'>
  | DrawMultiFeature<'MultiLineString'>
  | DrawMultiFeature<'MultiPolygon'>;

interface DrawActionableState {
  trash: boolean;
  combineFeatures: boolean;
  uncombineFeatures: boolean;
}

interface _DrawCTS extends DrawCTX {
  store: {
    getInitialConfigValue: (config: string) => boolean;
  }
}

export interface DrawCTX {
  map: Map;
  container: HTMLElement,
  drawConfig: DrawOptions;
  setSelected(features?: string | string[]): void;
  setSelectedCoordinates(
    coords: Array<{ coord_path: string; feature_id: string }>
  ): void;
  getSelected(): DrawFeature[];
  getSelectedIds(): string[];
  isSelected(id: string): boolean;
  getFeature(id: string): DrawFeature;
  select(id: string): void;
  delete(id: string): void;
  deleteFeature(id: string, opts?: any): void;
  addFeature(feature: DrawFeature): void;
  clearSelectedFeatures(): void;
  clearSelectedCoordinates(): void;
  setActionableState(actionableState: DrawActionableState): void;
  changeMode(mode: Modes, opts?: object, eventOpts?: object): void;
  updateUIClasses(opts: object): void;
  activateUIButton(name?: string): void;
  featuresAt(
    event: Event,
    bbox: BBox,
    bufferType: 'click' | 'tap'
  ): DrawFeature[];
  newFeature(geojson: GeoJSON): DrawFeature;
  isInstanceOf(type: string, feature: object): boolean;
  doRender(id: string): void;
  ui: DrawUI;
  _ctx: _DrawCTS;
}

export interface DrawUI {
  queueMapClasses: (options: { mode: null, feature: null, mouse: null }) => void;
  setActiveButton: (id: string) => void;
  updateMapClasses: () => void;
  clearMapClasses: () => void;
  addButtons: () => void;
  removeButtons: () => void;
}

export interface DrawCustomMode<
  CustomModeState = unknown,
  CustomModeOptions = unknown
> {
  onSetup?(this: DrawCTX & this, options: CustomModeOptions): CustomModeState;
  onDrag?(this: DrawCTX & this, state: CustomModeState, e: MapMouseEvent): void;
  onClick?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: MapMouseEvent
  ): void;
  onMouseMove?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: MapMouseEvent
  ): void;
  onMouseDown?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: MapMouseEvent
  ): void;
  onMouseUp?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: MapMouseEvent
  ): void;
  onMouseOut?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: MapMouseEvent
  ): void;
  onKeyUp?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: KeyboardEvent
  ): void;
  onKeyDown?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: KeyboardEvent
  ): void;
  onTouchStart?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: MapTouchEvent
  ): void;
  onTouchMove?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: MapTouchEvent
  ): void;
  onTouchEnd?(
    this: DrawCTX & this,
    state: CustomModeState,
    e: MapTouchEvent
  ): void;
  onTap?(this: DrawCTX & this, state: CustomModeState, e: MapTouchEvent): void;
  onStop?(this: DrawCTX & this, state: CustomModeState): void;
  onTrash?(this: DrawCTX & this, state: CustomModeState): void;
  onCombineFeature?(this: DrawCTX & this, state: CustomModeState): void;
  onUncombineFeature?(this: DrawCTX & this, state: CustomModeState): void;
  toDisplayFeatures(
    this: DrawCTX & this,
    state: CustomModeState,
    geojson: GeoJSON,
    display: (geojson: GeoJSON) => void
  ): void;
}

export declare class Draw implements IControl {
  options: DrawOptions;
  types: typeof types;
  modes: Modes;
  getDefaultPosition: () => ControlPosition;
  constructor(options?: DrawOptions);
  add(geojson: Feature | StrictFeatureCollection | Geometry): string[];
  get(featureId: string): Feature | undefined;
  getFeatureIdsAt(point: { x: number; y: number }): string[];
  getSelectedIds(): string[];
  getSelected(): StrictFeatureCollection;
  getSelectedPoints(): StrictFeatureCollection;
  getAll(): StrictFeatureCollection;
  delete(ids: string | string[]): this;
  deleteAll(): this;
  set(featureCollection: StrictFeatureCollection): string[];
  trash(): this;
  combineFeatures(): this;
  uncombineFeatures(): this;
  getMode(): (Modes & {}) | string;
  changeMode(
    mode: (typeof modes)['SIMPLE_SELECT'],
    options?: { featureIds: string[] }
  ): this;
  changeMode(
    mode: (typeof modes)['DIRECT_SELECT'],
    options: { featureId: string }
  ): this;
  changeMode(
    mode: (typeof modes)['DRAW_LINE_STRING'],
    options?: { featureId: string; from: Feature<Point> | Point | number[] }
  ): this;
  changeMode(mode: Modes): this;
  changeMode<T extends string>(
    mode: T & (T extends Modes ? never : T),
    options?: object
  ): this;
  setFeatureProperty(featureId: string, property: string, value: any): this;
  onAdd(map: Map): HTMLElement;
  onRemove(map: Map): unknown;
}
