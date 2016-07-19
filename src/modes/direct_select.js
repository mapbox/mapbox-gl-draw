var createSupplementaryPoints = require('../lib/create_supplementary_points');
const constrainFeatureMovement = require('../lib/constrain_feature_movement');
const Constants = require('../constants');
const CommonSelectors = require('../lib/common_selectors');

import ModeInterface from './mode_interface';

export default class DirectSelectMode extends ModeInterface {
  constructor (options, store, ui) {
    super();
    this.feature = store.getSelected()[0];

    if (this.feature === undefined) {
      throw new Error('A feature must be selected to enter DirectSelect mode');
    }

    if (this.feature.type === Constants.geojsonTypes.POINT) {
      throw new TypeError('direct_select mode doesn\'t handle point features');
    }

    this.featureId = this.feature.id;

    this.dragMoveLocation = null;
    this.dragMoving = false;
    this.canDragMove = false;

    this.selectedCoordPaths = []; // todo...

    this.doubleClickZoom(false);
  }

  startDragging (e) {
    this.dragPan(false);
    this.canDragMove = true;
    this.dragMoveLocation = e.lngLat;
  }

  stopDragging (e) {
    this.dragPan(true);
    this.dragMoving = false;
    this.canDragMove = false;
    this.dragMoveLocation = null;
  }

  onVertex (e) {
    this.startDragging(e);
    var about = e.featureTarget.properties;
    var selectedIndex = this.selectedCoordPaths.indexOf(about.coord_path);
    if (!isShiftDown(e) && selectedIndex === -1) {
      this.selectedCoordPaths = [about.coord_path];
    }
    else if (isShiftDown(e) && selectedIndex === -1) {
      this.selectedCoordPaths.push(about.coord_path);
    }
    this.feature.changed();
  }

  onMidpoint (e, store) {
    this.startDragging(e);
    var about = e.featureTarget.properties;
    feature.addCoordinate(about.coord_path, about.lng, about.lat);
    this.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: store.getSelected().map(f => f.toGeoJSON())
    });
    this.selectedCoordPaths = [about.coord_path];
  }

  onMouseMove (e) {
    this.stopDragging(e);
  }

  onMousedown (e) {
    if (CommonSelectors.isVertex(e)) {
      return this.onVertex(e);
    }

    if (CommonSelectors.isMidpoint(e)) {
      return this.onMidpoint(e);
    }
  }

  onDraw (e) {
    if (this.canDragMove) {
      this.dragMoving = true;
      e.originalEvent.stopPropagation();

      var selectedCoords = this.selectedCoordPaths.map(coord_path => this.feature.getCoordinate(coord_path));
      var selectedCoordPoints = selectedCoords.map(coords => ({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
          type: Constants.geojsonTypes.POINT,
          coordinates: coords
        }
      }));
      var delta = {
        lng: e.lngLat.lng - this.dragMoveLocation.lng,
        lat: e.lngLat.lat - this.dragMoveLocation.lat
      };
      var constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);

      for (var i = 0; i < selectedCoords.length; i++) {
        var coord = selectedCoords[i];
        this.feature.updateCoordinate(this.selectedCoordPaths[i],
          coord[0] + constrainedDelta.lng,
          coord[1] + constrainedDelta.lat);
      }

      this.dragMoveLocation = e.lngLat;
    }
  }

  onClick(e, store) {
    if (CommonSelectors.noTarget(e) || CommonSelectors.isInactiveFeature(e)) {
      store.clearSelected();
      return this.changeMode(Constants.modes.SIMPLE_SELECT);
    }

    this.stopDragging(e);
  }

  onMouseup (e, store) {
    if (this.dragMoving) {
      this.fire(Constants.events.UPDATE, {
        action: Constants.updateActions.CHANGE_COORDINATES,
        features: store.getSelected().map(f => f.toGeoJSON())
      });
    }
    stopDragging();
  }

  changeMode() {
    this.doubleClickZoom(true);
  }

  prepareAndRender(geojson, render) {
    if (featureId === geojson.properties.id) {
      geojson.properties.active = Constants.activeStates.ACTIVE;
      render(geojson);
      createSupplementaryPoints(geojson, {
        map: ctx.map,
        midpoints: true,
        selectedPaths: this.selectedCoordPaths
      }).forEach(render);
    }
    else {
      geojson.properties.active = Constants.activeStates.INACTIVE;
      render(geojson);
    }
  }

  onTrash(store, ui) {
    if (this.selectedCoordPaths.length === 0) {
      return this.changeMode(Constants.modes.SIMPLE_SELECT);
    }

    this.selectedCoordPaths.sort().reverse().forEach(id => this.feature.removeCoordinate(id));
    this.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: ctx.store.getSelected().map(f => f.toGeoJSON())
    });
    this.selectedCoordPaths = [];
    if (this.feature.isValid() === false) {
      store.delete([featureId]);
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  }

}
