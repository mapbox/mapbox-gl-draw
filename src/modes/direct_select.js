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
  const featureId = opts.featureId;
  const feature = ctx.store.get(featureId);

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

  const fireUpdate = function() {
    ctx.map.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: ctx.store.getSelected().map(f => f.toGeoJSON())
    });
  };

  const fireActionable = () => ctx.events.actionable({
    combineFeatures: false,
    uncombineFeatures: false,
    trash: selectedCoordPaths.length > 0
  });

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

  const onVertex = function(e) {
    startDragging(e);
    const about = e.featureTarget.properties;
    const selectedIndex = selectedCoordPaths.indexOf(about.coord_path);
    if (!isShiftDown(e) && selectedIndex === -1) {
      selectedCoordPaths = [about.coord_path];
    } else if (isShiftDown(e) && selectedIndex === -1) {
      selectedCoordPaths.push(about.coord_path);
    }
    feature.changed();
  };

  const onMidpoint = function(e) {
    startDragging(e);
    const about = e.featureTarget.properties;
    feature.addCoordinate(about.coord_path, about.lng, about.lat);
    fireUpdate();
    selectedCoordPaths = [about.coord_path];
  };

  const onFeature = function(e) {
    if (selectedCoordPaths.length === 0) startDragging(e);
    else stopDragging();
  };

  const dragFeature = (e, delta) => {
    moveFeatures(ctx.store.getSelected(), delta);
    dragMoveLocation = e.lngLat;
  };

  const dragVertex = (e, delta) => {
    const selectedCoords = selectedCoordPaths.map(coord_path => feature.getCoordinate(coord_path));
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
      feature.updateCoordinate(selectedCoordPaths[i],
      coord[0] + constrainedDelta.lng,
      coord[1] + constrainedDelta.lat);
    }
  };

  return {
    start: function() {
      ctx.store.setSelected(featureId);
      doubleClickZoom.disable(ctx);

      // On mousemove that is not a drag, stop vertex movement.
      this.on('mousemove', CommonSelectors.true, e => {
        const isFeature = CommonSelectors.isActiveFeature(e);
        const onVertex = isVertex(e);
        const noCoords = selectedCoordPaths.length === 0;
        if (isFeature && noCoords) ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
        else if (onVertex && !noCoords) ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
        else ctx.ui.queueMapClasses({ mouse: Constants.cursors.NONE });
        stopDragging(e);
      });

      // As soon as you mouse leaves the canvas, update the feature
      this.on('mouseout', () => dragMoving, fireUpdate);

      this.on('mousedown', isVertex, onVertex);
      this.on('mousedown', CommonSelectors.isActiveFeature, onFeature);
      this.on('mousedown', isMidpoint, onMidpoint);
      this.on('drag', () => canDragMove, (e) => {
        dragMoving = true;
        e.originalEvent.stopPropagation();

        const delta = {
          lng: e.lngLat.lng - dragMoveLocation.lng,
          lat: e.lngLat.lat - dragMoveLocation.lat
        };
        if (selectedCoordPaths.length > 0) dragVertex(e, delta);
        else dragFeature(e, delta);

        dragMoveLocation = e.lngLat;
      });
      this.on('click', CommonSelectors.true, stopDragging);
      this.on('mouseup', CommonSelectors.true, () => {
        if (dragMoving) {
          fireUpdate();
        }
        stopDragging();
      });
      this.on('click', noTarget, () => {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('click', isInactiveFeature, () => {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('click', CommonSelectors.isActiveFeature, () => {
        selectedCoordPaths = [];
        feature.changed();
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
      } else {
        geojson.properties.active = Constants.activeStates.INACTIVE;
        push(geojson);
      }
      fireActionable();
    },
    trash: function() {
      selectedCoordPaths.sort().reverse().forEach(id => feature.removeCoordinate(id));
      ctx.map.fire(Constants.events.UPDATE, {
        action: Constants.updateActions.CHANGE_COORDINATES,
        features: ctx.store.getSelected().map(f => f.toGeoJSON())
      });
      selectedCoordPaths = [];
      fireActionable();
      if (feature.isValid() === false) {
        ctx.store.delete([featureId]);
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {});
      }
    }
  };
};
