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

import {
  classes,
  sources,
  cursors,
  types,
  geojsonTypes,
  modes,
  events,
  updateActions,
  meta,
  activeStates,
  interactions
} from '../constants';

import type {
  CircleLayerSpecification,
  ControlPosition,
  FillLayerSpecification,
  IControl,
  LineLayerSpecification,
  Map,
  MapEvent,
  MapMouseEvent as MapboxMapMouseEvent,
  MapTouchEvent as MapboxMapTouchEvent
} from 'mapbox-gl';

// Extend Feature to require geometry and properties
export interface StrictFeature
  extends Omit<Feature, 'geometry' | 'properties'> {
  geometry: Geometry & { coordinates: unknown };
  properties: Record<string, unknown>;
}

// Extend FeatureCollection to use StrictFeature
export interface StrictFeatureCollection
  extends Omit<FeatureCollection, 'features'> {
  features: StrictFeature[];
}

// Example usage
export type XY = { x: number; y: number };

export type Coords = Array<[number, number]>;

export interface Entry {
  point: XY;
  time: number;
}

interface Modes {
  draw_line_string: DrawCustomMode;
  draw_polygon: DrawCustomMode;
  draw_point: DrawCustomMode;
  simple_select: DrawCustomMode;
  direct_select: DrawCustomMode;
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

export interface DrawUI {
  queueMapClasses: (options: {
    mode: null;
    feature: null;
    mouse: null;
  }) => void;
  setActiveButton: (id: string) => void;
  updateMapClasses: () => void;
  clearMapClasses: () => void;
  addButtons: () => void;
  removeButtons: () => void;
}

type DrawMode = DrawModes[keyof DrawModes];

interface DrawEvents {
  'draw.create': DrawCreateEvent;
  'draw.delete': DrawDeleteEvent;
  'draw.update': DrawUpdateEvent;
  'draw.selectionchange': DrawSelectionChangeEvent;
  'draw.render': DrawRenderEvent;
  'draw.combine': DrawCombineEvent;
  'draw.uncombine': DrawUncombineEvent;
  'draw.modechange': DrawModeChangeEvent;
  'draw.actionable': DrawActionableEvent;
}

type DrawEventType = keyof DrawEvents;

type DrawModes = (typeof modes)[keyof typeof modes];

interface DrawControls {
  point?: boolean | undefined;
  line_string?: boolean | undefined;
  polygon?: boolean | undefined;
  trash?: boolean | undefined;
  combine_features?: boolean | undefined;
  uncombine_features?: boolean | undefined;
}

interface DrawActionableState {
  trash: boolean;
  combineFeatures: boolean;
  uncombineFeatures: boolean;
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

type DrawFeature =
  | DrawPoint
  | DrawLineString
  | DrawPolygon
  | DrawMultiFeature<'MultiPoint'>
  | DrawMultiFeature<'MultiLineString'>
  | DrawMultiFeature<'MultiPolygon'>;

export interface MapMouseEvent extends MapboxMapMouseEvent {
  featureTarget: DrawFeature;
}

export interface MapTouchEvent extends MapboxMapTouchEvent {
  featureTarget: DrawFeature;
}

interface DrawEvent {
  target: Map;
  type: DrawEventType;
}

interface DrawCreateEvent extends DrawEvent {
  // Array of GeoJSON objects representing the features that were created
  features: Feature[];
  type: 'draw.create';
}

interface DrawDeleteEvent extends DrawEvent {
  // Array of GeoJSON objects representing the features that were deleted
  features: Feature[];
  type: 'draw.delete';
}

interface DrawCombineEvent extends DrawEvent {
  deletedFeatures: Feature[]; // Array of deleted features (those incorporated into new multifeatures)
  createdFeatures: Feature[]; // Array of created multifeatures
  type: 'draw.combine';
}

interface DrawUncombineEvent extends DrawEvent {
  deletedFeatures: Feature[]; // Array of deleted multifeatures (split into features)
  createdFeatures: Feature[]; // Array of created features
  type: 'draw.uncombine';
}

interface DrawUpdateEvent extends DrawEvent {
  features: Feature[]; // Array of features that were updated
  action: string; // Name of the action that triggered the update
  type: 'draw.update';
}

interface DrawSelectionChangeEvent extends DrawEvent {
  features: Feature[]; // Array of features that are selected after the change
  points: Array<Feature<Point>>;
  type: 'draw.selectionchange';
}

interface DrawModeChangeEvent extends DrawEvent {
  mode: DrawMode; // The next mode, i.e. the mode that Draw is changing to
  type: 'draw.modechange';
}

interface DrawRenderEvent extends DrawEvent {
  type: 'draw.render';
}

interface DrawActionableEvent extends DrawEvent {
  actions: DrawActionableState;
  type: 'draw.actionable';
}

export interface DrawCTX {
  map: Map;
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
  changeMode(mode: DrawMode, opts?: object, eventOpts?: object): void;
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
}

interface DrawCustomMode<CustomModeState = any, CustomModeOptions = any> {
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

interface Modes {
  draw_line_string: DrawCustomMode;
  draw_polygon: DrawCustomMode;
  draw_point: DrawCustomMode;
  simple_select: DrawCustomMode;
  direct_select: DrawCustomMode;
}

// Convert these to use imports from constants
interface Constants {
  readonly classes: (typeof classes)[keyof typeof classes];
  readonly sources: (typeof sources)[keyof typeof sources];
  readonly cursors: (typeof cursors)[keyof typeof cursors];
  readonly types: (typeof types)[keyof typeof types];
  readonly geojsonTypes: (typeof geojsonTypes)[keyof typeof geojsonTypes];
  readonly events: (typeof events)[keyof typeof events];
  readonly updateActions: (typeof updateActions)[keyof typeof updateActions];
  readonly meta: (typeof meta)[keyof typeof meta];
  readonly activeStates: (typeof activeStates)[keyof typeof activeStates];
  readonly interactions: (typeof interactions)[keyof typeof interactions];
  readonly LAT_MIN: -90;
  readonly LAT_RENDERED_MIN: -85;
  readonly LAT_MAX: 90;
  readonly LAT_RENDERED_MAX: 85;
  readonly LNG_MIN: -270;
  readonly LNG_MAX: 270;
}

interface StringSet {
  add(x: string | number): StringSet;
  delete(x: string | number): StringSet;
  has(x: string | number): boolean;
  values(): string | number[];
  clear(): StringSet;
}

export interface Lib {
  CommonSelectors: {
    isOfMetaType: (
      type: Constants['meta'][keyof Constants['meta']]
    ) => (e: MapMouseEvent | MapTouchEvent) => boolean;
    isShiftMousedown: (e: MapEvent) => boolean;
    isActiveFeature: (e: MapMouseEvent | MapTouchEvent) => boolean;
    isInactiveFeature: (e: MapMouseEvent | MapTouchEvent) => boolean;
    noTarget: (e: MapMouseEvent | MapTouchEvent) => boolean;
    isFeature: (e: MapMouseEvent | MapTouchEvent) => boolean;
    isVertex: (e: MapMouseEvent | MapTouchEvent) => boolean;
    isShiftDown: (e: MapEvent) => boolean;
    isEscapeKey: (e: KeyboardEvent) => boolean;
    isEnterKey: (e: KeyboardEvent) => boolean;
    isTrue: () => boolean;
  };

  constrainFeatureMovement(
    geojsonFeatures: DrawFeature[],
    delta: { lng: number; lat: number }
  ): { lng: number; lat: number };

  createMidPoint(
    parent: string,
    startVertex: Feature,
    endVertex: Feature
  ): Feature<Point> | null;

  createSupplementaryPoints(
    geojson: Feature,
    options?: { midpoints?: boolean; selectedPaths?: string[] },
    basePath?: string
  ): Array<Feature<Point>>;

  createVertex(
    parentId: string,
    coordinates: Position,
    path: string,
    selected: boolean
  ): Feature<Point>;

  doubleClickZoom: {
    enable: (ctx: DrawCTX) => void; // ?? ctx
    disable: (ctx: DrawCTX) => void; // ?? ctx
  };

  featuresAt: {
    click: (event: MapMouseEvent, bbox: BBox, ctx: DrawCTX) => Feature[]; // ?? ctx
    touch: (event: MapTouchEvent, bbox: BBox, ctx: DrawCTX) => Feature[]; // ?? ctx
  };

  getFeatureAtAndSetCursors(event: MapMouseEvent, ctx: DrawCTX): Feature;

  euclideanDistance(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number;

  isClick(
    start: { point?: Entry },
    end: { point: Entry },
    options?: {
      fineTolerance?: number;
      grossTolerance?: number;
      interval?: number;
    }
  ): boolean;

  isEventAtCoordinates(event: MapMouseEvent, coordinates: Position[]): boolean;

  isTap(
    start: { point?: Entry },
    end: { point: Entry },
    options?: { tolerance?: number; interval?: number }
  ): boolean;

  /**
   * Returns a bounding box representing the event's location.
   *
   * @param mapEvent - Mapbox GL JS map event, with a point properties.
   * @param [buffer=0]
   * @return Bounding box.
   */
  mapEventToBoundingBox(
    mapEvent: MapMouseEvent | MapTouchEvent,
    buffer?: number
  ): Position[];

  ModeHandler: (
    mode: any,
    DrawContext: any
  ) => {
    render: any;
    stop: () => void;
    trash: () => void;
    combineFeatures: () => void;
    uncombineFeatures: () => void;
    drag: (event: any) => void;
    click: (event: any) => void;
    mousemove: (event: any) => void;
    mousedown: (event: any) => void;
    mouseup: (event: any) => void;
    mouseout: (event: any) => void;
    keydown: (event: any) => void;
    keyup: (event: any) => void;
    touchstart: (event: any) => void;
    touchmove: (event: any) => void;
    touchend: (event: any) => void;
    tap: (event: any) => void;
  };

  moveFeatures(
    features: DrawFeature[],
    delta: { lng: number; lat: number }
  ): void;

  /**
   * Sort features in the following order Point: 0, LineString: 1, MultiLineString: 1,
   * Polygon: 2, then sort polygons by area ascending.
   * @param features
   */
  sortFeatures(features: DrawFeature[]): DrawFeature[];

  stringSetsAreEqual(
    a: Array<Pick<Feature, 'id'>>,
    b: Array<Pick<Feature, 'id'>>
  ): boolean;

  StringSet(items?: Array<string | number>): StringSet;

  theme: Array<
    (
      | FillLayerSpecification
      | LineLayerSpecification
      | CircleLayerSpecification
    ) & { id: ThemeLayerId }
  >;

  /**
   * Derive a dense array (no `undefined`s) from a single value or array.
   */
  toDenseArray(x: any): Array<NonNullable<any>>;
}

type ThemeLayerId =
  | 'gl-draw-polygon-fill-static'
  | 'gl-draw-polygon-fill-active'
  | 'gl-draw-polygon-fill-inactive'
  | 'gl-draw-polygon-stroke-static'
  | 'gl-draw-polygon-stroke-active'
  | 'gl-draw-polygon-stroke-inactive'
  | 'gl-draw-polygon-midpoint'
  | 'gl-draw-polygon-and-line-vertex-inactive'
  | 'gl-draw-polygon-and-line-vertex-stroke-inactive'
  | 'gl-draw-line-static'
  | 'gl-draw-line-active'
  | 'gl-draw-line-inactive'
  | 'gl-draw-point-static'
  | 'gl-draw-point-active'
  | 'gl-draw-point-inactive'
  | 'gl-draw-point-stroke-active'
  | 'gl-draw-point-point-stroke-inactive';

export interface DrawOptions {
  displayControlsDefault?: boolean | undefined;
  keybindings?: boolean | undefined;
  touchEnabled?: boolean | undefined;
  boxSelect?: boolean | undefined;
  clickBuffer?: number | undefined;
  touchBuffer?: number | undefined;
  controls?: DrawControls | undefined;
  styles?: object[] | undefined;
  modes?: { [modeKey: string]: DrawCustomMode } | undefined;
  defaultMode?: string | undefined;
  userProperties?: boolean | undefined;
}

interface DrawEvents {
  actionable(action: DrawActionableState): void;
  addEventListeners(): void;
  changeMode(mode: string, modeOptions: {}, eventOptions: {}): void;
  combineFeatures(): void;
  currentModeName(): void;
  currentModeRender(geojson: StrictFeature, push: (geojson: StrictFeature) => void): void;
  fire(eventName: string, eventData: unknown): DrawMode;
  getMode(): DrawMode;
  removeEventListeners(): void;
  start(): void;
  trash(options?: { silent: boolean}): void;
  uncombineFeatures(): void; 
}

interface DrawStore {
  ctx: CTX;
  isDirty: boolean;
  render(): void;
  sources: {
    hot: [],
    cold: []
  }
}

interface DrawSetup {
  addLayers(): void;
  removeLayers(): void;
  onAdd(map: Map): void;
  onRemove(): void;
  connect(): void;
}

export interface CTX {
  api: Draw;
  boxZoomInitial: boolean;
  container: HTMLElement;
  events: DrawEvents;
  map: Map;
  options: DrawOptions;
  setup: DrawSetup;
  store: DrawStore;
  ui: DrawUI;
}

export declare class Draw implements IControl {
  static modes: Modes;
  static constants: Constants;
  static lib: Lib;

  modes: DrawModes;

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

  trash(): DrawEvents['trash'];

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
