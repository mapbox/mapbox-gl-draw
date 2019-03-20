// TypeScript definitions file for @mapbox/mapbox-gl-draw.
// This file is based on the Readme.md file in the repository and should be manually updated once the interface changes.
// 
// Currently based on mapbox-gl-draw 1.0.9
// Related Github issue: #842

declare module '@mapbox/mapbox-gl-draw' {
  import {Feature, FeatureCollection} from 'geojson'
  import {IControl} from 'mapbox-gl'
  import {IMapboxDrawControls} from '@mapbox/mapbox-gl-draw'

  namespace MapboxDraw {
    export interface IMapboxDrawControls {
      point?: boolean,
      line_string?: boolean,
      polygon?: boolean
      trash?: boolean,
      combine_features?: boolean,
      uncombine_features?: boolean
    }
  }

  class MapboxDraw implements IControl {

    getDefaultPosition: () => string

    constructor(options?: {
      displayControlsDefault?: boolean,
      keybindings?: boolean,
      touchEnabled?: boolean,
      boxSelect?: boolean,
      clickBuffer?: number,
      touchBuffer?: number,
      controls?: IMapboxDrawControls,
      styles?: object[],
      modes?: object,
      defaultMode?: string,
      userProperties?: boolean
    });

    public add(geojson: object): string[]

    public get(featureId: string): Feature | undefined

    public getFeatureIdsAt(point: { x: number, y: number }): string[]

    public getSelectedIds(): string[]

    public getSelected(): FeatureCollection

    public getSelectedPoints(): FeatureCollection

    public getAll(): FeatureCollection

    public delete(ids: string | string[]): this

    public deleteAll(): this

    public set(featureCollection: FeatureCollection): string[]

    public trash(): this

    public combineFeatures(): this

    public uncombineFeatures(): this

    public getMode(): string

    public changeMode(mode: string, options?: object): this

    public setFeatureProperty(featureId: string, property: string, value: any): this

    onAdd(map: mapboxgl.Map): HTMLElement

    onRemove(map: mapboxgl.Map): any

  }

  export = MapboxDraw
}
