const {noTarget, isOfMetaType, isInactiveFeature, isShiftDown} = require('../lib/common_selectors');
const createSupplementaryPoints = require('../lib/create_supplementary_points');
const constrainFeatureMovement = require('../lib/constrain_feature_movement');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const CommonSelectors = require('../lib/common_selectors');
const moveFeatures = require('../lib/move_features');

const isVertex = isOfMetaType(Constants.meta.VERTEX);
const isMidpoint = isOfMetaType(Constants.meta.MIDPOINT);

module.exports = function(ctx, opts) {
  let featureId = opts.featureId;
  let feature = ctx.store.get(featureId);
  let dragFeature = opts.dragFeature;

  if (!feature) {
    throw new Error('You must provide a featureId to enter direct_select mode');
  }

  if (feature.type === Constants.geojsonTypes.POINT) {
    throw new TypeError('direct_select mode doesn\'t handle point features');
  }

  let dragMoveLocation = opts.startPos || null;
  let dragMoving = false;
  let canDragMove = false;

  let selectedCoordPaths = opts.coordPath ? [opts.coordPath] : [];

  let dragMode = null;

  const onVertex = function(e) {
    startDragging(e);
    dragMode = 'vertex';
    let about = e.featureTarget.properties;
    let selectedIndex = selectedCoordPaths.indexOf(about.coord_path);
    if (!isShiftDown(e) && selectedIndex === -1) {
      selectedCoordPaths = [about.coord_path];
    }
    else if (isShiftDown(e) && selectedIndex === -1) {
      selectedCoordPaths.push(about.coord_path);
    }
    feature.changed();
  };

  const onMidpoint = function(e) {
    startDragging(e);
    dragMode = 'midpoint';
    let about = e.featureTarget.properties;
    feature.addCoordinate(about.coord_path, about.lng, about.lat);
    ctx.map.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: ctx.store.getSelected().map(f => f.toGeoJSON())
    });
    selectedCoordPaths = [about.coord_path];
  };

  const startDragging = function(e) {
    ctx.map.dragPan.disable();
    canDragMove = true;
    dragMoveLocation = e.lngLat;
  };

  const stopDragging = function() {
    ctx.map.dragPan.enable();
    dragMoving = false;
    canDragMove = false;
    dragMoveLocation = null;
  };

  return {
    start: function() {
      ctx.store.setSelected(featureId);
      doubleClickZoom.disable(ctx);

      // On mousemove that is not a drag, stop vertex movement.
      this.on('mousemove', CommonSelectors.true, stopDragging);

      this.on('mousedown', isVertex, onVertex);
      this.on('mousedown', isMidpoint, onMidpoint);

      if (dragFeature) {

        this.on('mousedown', CommonSelectors.isActiveFeature, function (e) {
          dragMode = 'feature';

          startDragging(e);
          dragMoving = false;

          this.render(e.featureTarget.properties.id);
        });
      }

      this.on('drag', () => canDragMove, function(e) {

        if (dragFeature && dragMode === 'feature') {

          dragMoving = true;
          e.originalEvent.stopPropagation();

          const delta = {
            lng: e.lngLat.lng - dragMoveLocation.lng,
            lat: e.lngLat.lat - dragMoveLocation.lat
          };

          moveFeatures(ctx.store.getSelected(), delta);

          dragMoveLocation = e.lngLat;

        } else {

          dragMoving = true;
          e.originalEvent.stopPropagation();

          let selectedCoords = selectedCoordPaths.map(coord_path => feature.getCoordinate(coord_path));
          let selectedCoordPoints = selectedCoords.map(coords => ({
            type      : Constants.geojsonTypes.FEATURE,
            properties: {},
            geometry  : {
              type       : Constants.geojsonTypes.POINT,
              coordinates: coords
            }
          }));
          let delta = {
            lng: e.lngLat.lng - dragMoveLocation.lng,
            lat: e.lngLat.lat - dragMoveLocation.lat
          };
          let constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);

          for (let i = 0; i < selectedCoords.length; i++) {
            let coord = selectedCoords[i];
            feature.updateCoordinate(selectedCoordPaths[i],
              coord[0] + constrainedDelta.lng,
              coord[1] + constrainedDelta.lat);
          }

          dragMoveLocation = e.lngLat;
        }
      });
      this.on('click', CommonSelectors.true, stopDragging);
      this.on('mouseup', CommonSelectors.true, function() {
        if (dragMoving) {
          ctx.map.fire(Constants.events.UPDATE, {
            action: Constants.updateActions.CHANGE_COORDINATES,
            features: ctx.store.getSelected().map(f => f.toGeoJSON())
          });
        }
        stopDragging();
      });
      this.on('click', noTarget, function() {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('click', isInactiveFeature, function() {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
    },

    stop: function() {
      doubleClickZoom.enable(ctx);
    },

    render: function(geojson, push) {
      if (featureId === geojson.properties.id) {
        geojson.properties.active = Constants.activeStates.ACTIVE;
        push(geojson);
        createSupplementaryPoints(geojson, {
          map: ctx.map,
          midpoints: true,
          selectedPaths: selectedCoordPaths
        }).forEach(push);
      }
      else {
        geojson.properties.active = Constants.activeStates.INACTIVE;
        push(geojson);
      }
    },

    trash: function() {
      if (selectedCoordPaths.length === 0) {
        return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { features: [feature] });
      }

      selectedCoordPaths.sort().reverse().forEach(id => feature.removeCoordinate(id));
      ctx.map.fire(Constants.events.UPDATE, {
        action: Constants.updateActions.CHANGE_COORDINATES,
        features: ctx.store.getSelected().map(f => f.toGeoJSON())
      });
      selectedCoordPaths = [];
      if (feature.isValid() === false) {
        ctx.store.delete([featureId]);
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, null);
      }
    }
  };
};
