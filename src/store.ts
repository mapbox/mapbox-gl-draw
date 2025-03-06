import { toDenseArray } from './lib/to_dense_array';
import StringSet from './lib/string_set';
import render from './render';
import * as Constants from './constants';
import type { DrawCTX, Feature, FeatureId, Coordinate, StoreOptions } from './types/types';

type MapConfig = Record<string, boolean>;

type FeaturePropertyOptions = {
  silent?: boolean;
  action?: string;
};

export default class Store {
  private _features: Record<string, Feature> = {};
  private _featureIds = new StringSet();
  private _selectedFeatureIds = new StringSet();
  private _selectedCoordinates: Coordinate[] = [];
  private _changedFeatureIds = new StringSet();
  private _emitSelectionChange = false;
  private _mapInitialConfig: MapConfig = {};
  private ctx: DrawCTX;
  private isDirty = false;
  private sources = { hot: [], cold: [] };
  private renderRequest: number | null = null;

  constructor(ctx: DrawCTX) {
    this.ctx = ctx;
  }

  render = (): void => {
    if (!this.renderRequest) {
      this.renderRequest = requestAnimationFrame(() => {
        this.renderRequest = null;
        render.call(this);

        if (this._emitSelectionChange) {
          this.ctx.events.fire(Constants.events.SELECTION_CHANGE, {
            features: this.getSelected().map(feature => feature.toGeoJSON()),
            points: this.getSelectedCoordinates().map(coordinate => ({
              type: Constants.geojsonTypes.FEATURE,
              properties: {},
              geometry: {
                type: Constants.geojsonTypes.POINT,
                coordinates: coordinate.coordinates,
              },
            })),
          });
          this._emitSelectionChange = false;
        }

        this.ctx.events.fire(Constants.events.RENDER, {});
      });
    }
  };

  createRenderBatch(): () => void {
    const holdRender = this.render;
    let numRenders = 0;
    this.render = () => numRenders++;

    return () => {
      this.render = holdRender;
      if (numRenders > 0) this.render();
    };
  }

  setDirty(): this {
    this.isDirty = true;
    return this;
  }

  featureCreated(featureId: FeatureId, options: StoreOptions = {}): this {
    this._changedFeatureIds.add(featureId);
    if (!options.silent) {
      const feature = this.get(featureId);
      this.ctx.events.fire(Constants.events.CREATE, { features: [feature.toGeoJSON()] });
    }
    return this;
  }

  featureChanged(featureId: FeatureId, options: FeaturePropertyOptions = {}): this {
    this._changedFeatureIds.add(featureId);
    if (!options.silent) {
      this.ctx.events.fire(Constants.events.UPDATE, {
        action: options.action ?? Constants.updateActions.CHANGE_COORDINATES,
        features: [this.get(featureId).toGeoJSON()],
      });
    }
    return this;
  }

  getChangedIds(): string[] {
    return this._changedFeatureIds.values();
  }

  clearChangedIds(): this {
    this._changedFeatureIds.clear();
    return this;
  }

  getAllIds(): string[] {
    return this._featureIds.values();
  }

  add(feature: Feature, options: StoreOptions = {}): this {
    this._features[feature.id] = feature;
    this._featureIds.add(feature.id);
    this.featureCreated(feature.id, { silent: options.silent });
    return this;
  }

  delete(featureIds: FeatureId | FeatureId[], options: StoreOptions = {}): this {
    const deletedFeatures: Feature[] = [];
    toDenseArray(featureIds).forEach(id => {
      if (!this._featureIds.has(id)) return;
      this._featureIds.delete(id);
      this._selectedFeatureIds.delete(id);
      if (!options.silent) {
        deletedFeatures.push(this._features[id].toGeoJSON());
      }
      delete this._features[id];
      this.isDirty = true;
    });

    if (deletedFeatures.length) {
      this.ctx.events.fire(Constants.events.DELETE, { features: deletedFeatures });
    }

    this.refreshSelectedCoordinates(options);
    return this;
  }

  get(id: FeatureId): Feature {
    return this._features[id];
  }

  getAll(): Feature[] {
    return Object.values(this._features);
  }

  getSelectedIds(): string[] {
    return this._selectedFeatureIds.values();
  }

  getSelected(): Feature[] {
    return this.getSelectedIds().map(id => this.get(id));
  }

  getSelectedCoordinates(): Coordinate[] {
    return this._selectedCoordinates.map(coordinate => {
      const feature = this.get(coordinate.feature_id);
      return { coordinates: feature.getCoordinate(coordinate.coord_path) };
    });
  }

  select(featureIds: FeatureId[], options: StoreOptions = {}): this {
    toDenseArray(featureIds).forEach(id => {
      if (this._selectedFeatureIds.has(id)) return;
      this._selectedFeatureIds.add(id);
      this._changedFeatureIds.add(id);
      if (!options.silent) this._emitSelectionChange = true;
    });
    return this;
  }

  deselect(featureIds: FeatureId[], options: StoreOptions = {}): this {
    toDenseArray(featureIds).forEach(id => {
      if (!this._selectedFeatureIds.has(id)) return;
      this._selectedFeatureIds.delete(id);
      this._changedFeatureIds.add(id);
      if (!options.silent) this._emitSelectionChange = true;
    });
    this.refreshSelectedCoordinates(options);
    return this;
  }

  setSelected(featureIds: FeatureId[], options: StoreOptions = {}): this {
    featureIds = toDenseArray(featureIds);

    // Deselect any features not in the new selection
    this.deselect(this._selectedFeatureIds.values().filter(id => featureIds.indexOf(id) === -1), { silent: options.silent });

    // Select any features in the new selection that were not already selected
    this.select(featureIds.filter(id => !this._selectedFeatureIds.has(id)), { silent: options.silent });

    return this;
  };

  isSelected(featureId: string): this {
    return this._selectedFeatureIds.has(featureId);
  };

  clearSelected(options: StoreOptions = {}): this {
    this.deselect(this._selectedFeatureIds.values(), { silent: options.silent });
    return this;
  };

  storeMapConfig() {
    Constants.interactions.forEach((interaction) => {
      const interactionSet = this.ctx.map[interaction];
      if (interactionSet) {
        this._mapInitialConfig[interaction] = this.ctx.map[interaction].isEnabled();
      }
    });
  }

  restoreMapConfig() {
    Object.keys(this._mapInitialConfig).forEach((key) => {
      const value = this._mapInitialConfig[key];
      if (value) {
        this.ctx.map[key].enable();
      } else {
        this.ctx.map[key].disable();
      }
    });
  }

  private refreshSelectedCoordinates(options: StoreOptions = {}): void {
    const newSelectedCoordinates = this._selectedCoordinates.filter(point => this._selectedFeatureIds.has(point.feature_id));
    if (this._selectedCoordinates.length !== newSelectedCoordinates.length && !options.silent) {
      this._emitSelectionChange = true;
    }
    this._selectedCoordinates = newSelectedCoordinates;
  }
}

