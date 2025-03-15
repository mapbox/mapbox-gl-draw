import {
  noTarget,
  isOfMetaType,
  isActiveFeature,
  isInactiveFeature,
  isShiftDown
} from '../lib/common_selectors';
import { createSupplementaryPoints } from '../lib/create_supplementary_points';
import { constrainFeatureMovement } from '../lib/constrain_feature_movement';
import { doubleClickZoom } from '../lib/double_click_zoom';
import * as Constants from '../constants';
import moveFeatures from '../lib/move_features';

import type { DirectSelectState, DrawCustomMode, MapMouseEvent, MapTouchEvent, DrawCoords } from '../types/types';

const isVertex = isOfMetaType(Constants.meta.VERTEX);
const isMidpoint = isOfMetaType(Constants.meta.MIDPOINT);

type Event = MapMouseEvent | MapTouchEvent;

interface DirectSelectMode extends DrawCustomMode {
  fireUpdate(): void;
  clickInactive(): void;
  fireActionable(state: DirectSelectState): void;
  clickNoTarget(state: DirectSelectState, e: Event): void;
  startDragging(state: DirectSelectState, e: Event): void;
  stopDragging(state: DirectSelectState): void;
  onVertex(state: DirectSelectState, e: Event): void;
  onMidpoint(state: DirectSelectState, e: Event): void;
  onFeature(state: DirectSelectState, e: Event): void;
  dragFeature(state: DirectSelectState, e: Event, delta: { lng: number, lat: number }): void;
  dragVertex(state: DirectSelectState, e: Event, delta: { lng: number, lat: number }): void;
  clickActiveFeature(state: DirectSelectState): void;
  pathsToCoordinates(featureId: string, paths: []): DrawCoords;
  _start(state: DirectSelectState, e: Event): void;
  _select(state: DirectSelectState, e: Event): void;
  _end(state: DirectSelectState): void;
}

const DirectSelect: DirectSelectMode = {

  // INTERNAL FUNCTIONS
  fireUpdate: function () {
    this.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: this.getSelected().map(f => f.toGeoJSON())
    });
  },

  fireActionable: function (state) {
    this.setActionableState({
      combineFeatures: false,
      uncombineFeatures: false,
      trash: state.selectedCoordPaths.length > 0
    });
  },

  startDragging: function (state, e) {
    if (state.initialDragPanState == null) {
      state.initialDragPanState = this.map.dragPan.isEnabled();
    }

    this.map.dragPan.disable();
    state.canDragMove = true;
    state.dragMoveLocation = e.lngLat;
  },

  stopDragging: function (state) {
    if (state.canDragMove && state.initialDragPanState === true) {
      this.map.dragPan.enable();
    }

    state.initialDragPanState = null;
    state.dragMoving = false;
    state.canDragMove = false;
    state.dragMoveLocation = null;
  },

  onVertex: function (state, e) {
    this.startDragging(state, e);
    const { coord_path } = e.featureTarget.properties;

    const selectedIndex = state.selectedCoordPaths.indexOf(coord_path);
    if (!isShiftDown(e as MapMouseEvent) && selectedIndex === -1) {
      state.selectedCoordPaths = [coord_path];
    } else if (isShiftDown(e as MapMouseEvent) && selectedIndex === -1) {
      state.selectedCoordPaths.push(coord_path);
    }

    const selectedCoordinates = this.pathsToCoordinates(
      state.featureId,
      state.selectedCoordPaths
    );
    this.setSelectedCoordinates(selectedCoordinates);
  },

  onMidpoint: function (state, e) {
    this.startDragging(state, e);
    const about = e.featureTarget.properties;
    state.feature.addCoordinate(about.coord_path, about.lng, about.lat);
    this.fireUpdate();
    state.selectedCoordPaths = [about.coord_path];
  },

  pathsToCoordinates: function (featureId, paths) {
    return paths.map(coord_path => ({ feature_id: featureId, coord_path }));
  },

  onFeature: function (state, e) {
    if (state.selectedCoordPaths.length === 0) this.startDragging(state, e);
    else this.stopDragging(state);
  },

  dragFeature: function (state, e, delta) {
    moveFeatures(this.getSelected(), delta);
    state.dragMoveLocation = e.lngLat;
  },

  dragVertex: function (state, e, delta) {
    const selectedCoords = state.selectedCoordPaths.map(coord_path =>
      state.feature.getCoordinate(coord_path)
    );
    const selectedCoordPoints = selectedCoords.map(coords => ({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: coords
      }
    }));

    const constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);
    for (let i = 0; i < selectedCoords.length; i++) {
      const coord = selectedCoords[i];
      state.feature.updateCoordinate(
        state.selectedCoordPaths[i],
        coord[0] + constrainedDelta.lng,
        coord[1] + constrainedDelta.lat
      );
    }
  },

  clickNoTarget: function () {
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },

  clickInactive: function () {
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },

  clickActiveFeature: function (state) {
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    state.feature.changed();
  },

  // EXTERNAL FUNCTIONS
  onSetup: function (opts) {
    const featureId = opts.featureId;
    const feature = this.getFeature(featureId);

    if (!feature) {
      throw new Error('You must provide a featureId to enter direct_select mode');
    }

    if (feature.type === Constants.geojsonTypes.POINT) {
      throw new TypeError("direct_select mode doesn't handle point features");
    }

    const state = {
      featureId,
      feature,
      dragMoveLocation: opts.startPos || null,
      dragMoving: false,
      canDragMove: false,
      selectedCoordPaths: opts.coordPath ? [opts.coordPath] : []
    };

    this.setSelectedCoordinates(
      this.pathsToCoordinates(featureId, state.selectedCoordPaths)
    );
    this.setSelected(featureId);
    doubleClickZoom.disable(this);

    this.setActionableState({
      trash: true
    });

    return state;
  },

  onStop: function () {
    doubleClickZoom.enable(this);
    this.clearSelectedCoordinates();
  },

  onTrash: function (state) {
    // Uses number-aware sorting to make sure '9' < '10'. Comparison is reversed because we want them
    // in reverse order so that we can remove by index safely.
    state.selectedCoordPaths
      .sort((a, b) => b.localeCompare(a, 'en', { numeric: true }))
      .forEach(id => state.feature.removeCoordinate(id));
    this.fireUpdate();
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    this.fireActionable(state);
    if (state.feature.isValid() === false) {
      this.deleteFeature([state.featureId]);
      this.changeMode(Constants.modes.SIMPLE_SELECT, {});
    }
  },

  onMouseMove: function (state, e) {
    // On mousemove that is not a drag, stop vertex movement.
    const isFeature = isActiveFeature(e);
    const onVertex = isVertex(e);
    const isMidPoint = isMidpoint(e);
    const noCoords = state.selectedCoordPaths.length === 0;
    if (isFeature && noCoords)
      this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    else if (onVertex && !noCoords)
      this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    else this.updateUIClasses({ mouse: Constants.cursors.NONE });

    const isDraggableItem = onVertex || isFeature || isMidPoint;
    if (isDraggableItem && state.dragMoving) this.fireUpdate();

    this.stopDragging(state);

    // Skip render
    return true;
  },

  onMouseOut: function (state) {
    // As soon as you mouse leaves the canvas, update the feature
    if (state.dragMoving) this.fireUpdate();

    // Skip render
    return true;
  },

  _start: function (state, e) {
    if (isVertex(e)) return this.onVertex(state, e);
    if (isActiveFeature(e)) return this.onFeature(state, e);
    if (isMidpoint(e)) return this.onMidpoint(state, e);
  },

  onTouchStart: function (state, e) { return this._start(state, e); },
  onMouseDown: function (state, e) { return this._start(state, e); },

  onDrag: function (state, e) {
    if (state.canDragMove !== true) return;
    state.dragMoving = true;
    e.originalEvent.stopPropagation();

    const delta = {
      lng: e.lngLat.lng - state.dragMoveLocation.lng,
      lat: e.lngLat.lat - state.dragMoveLocation.lat
    };
    if (state.selectedCoordPaths.length > 0) this.dragVertex(state, e, delta);
    else this.dragFeature(state, e, delta);

    state.dragMoveLocation = e.lngLat;
  },

  _select: function (state, e) {
    if (noTarget(e)) return this.clickNoTarget(state, e);
    if (isActiveFeature(e)) return this.clickActiveFeature(state, e);
    if (isInactiveFeature(e)) return this.clickInactive(state, e);
    this.stopDragging(state);
  },

  onTap: function (state, e) { return this._select(state, e); },
  onClick: function (state, e) { return this._select(state, e); },

  _end: function (state) {
    if (state.dragMoving) {
      this.fireUpdate();
    }
    this.stopDragging(state);
  },

  onMouseUp: function (state) { return this._end(state); },
  onTouchEnd: function (state) { return this._end(state); },

  toDisplayFeatures: function (state, geojson, push) {
    if (state.featureId === geojson.properties.id) {
      geojson.properties.active = Constants.activeStates.ACTIVE;
      push(geojson);
      createSupplementaryPoints(geojson, {
        map: this.map,
        midpoints: true,
        selectedPaths: state.selectedCoordPaths
      }).forEach(push);
    } else {
      geojson.properties.active = Constants.activeStates.INACTIVE;
      push(geojson);
    }

    this.fireActionable(state);
  }

};

export default DirectSelect;

