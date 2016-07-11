var createSupplementaryPoints = require('../lib/create_supplementary_points');
const constrainFeatureMovement = require('../lib/constrain_feature_movement');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const CommonSelectors = require('../lib/common_selectors');

module.exports = function(ctx, opts) {
  var featureId = opts.featureId;
  var feature = ctx.store.get(featureId);

  if (!feature) {
    throw new Error('You must provide a featureId to enter direct_select mode');
  }

  if (feature.type === Constants.geojsonTypes.POINT) {
    throw new TypeError('direct_select mode doesn\'t handle point features');
  }

  var dragMoveLocation = opts.startPos || null;
  var dragMoving = false;
  var canDragMove = false;

  var selectedCoordPaths = opts.coordPath ? [opts.coordPath] : [];

  var onVertex = function(e) {
    startDragging(e);
    var about = e.featureTarget.properties;
    var selectedIndex = selectedCoordPaths.indexOf(about.coord_path);
    if (!CommonSelectors.isShiftDown(e) && selectedIndex === -1) {
      selectedCoordPaths = [about.coord_path];
    }
    else if (CommonSelectors.isShiftDown(e) && selectedIndex === -1) {
      selectedCoordPaths.push(about.coord_path);
    }
    feature.changed();
  };

  var onMidpoint = function(e) {
    startDragging(e);
    var about = e.featureTarget.properties;
    feature.addCoordinate(about.coord_path, about.lng, about.lat);
    ctx.map.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: ctx.store.getSelected().map(f => f.toGeoJSON())
    });
    selectedCoordPaths = [about.coord_path];
  };

  var startDragging = function(e) {
    ctx.map.dragPan.disable();
    canDragMove = true;
    dragMoveLocation = e.lngLat;
  };

  var stopDragging = function() {
    ctx.map.dragPan.enable();
    dragMoving = false;
    canDragMove = false;
    dragMoveLocation = null;
  };

  return {
    start: function() {
      ctx.store.setSelected(featureId);
      doubleClickZoom.disable(ctx);

      this.on('mousemove', (e) => {
        stopDragging(e);
      });

      this.on('mousedown', (e) => {
        if (CommonSelectors.isVertex(e))  return onVertex(e);
        if (CommonSelectors.isMidpoint(e)) return onMidpoint(e);
      });

      this.on('drag', (e) => {
        if(canDragMove) {
          dragMoving = true;
          e.originalEvent.stopPropagation();

          var selectedCoords = selectedCoordPaths.map(coord_path => feature.getCoordinate(coord_path));
          var selectedCoordPoints = selectedCoords.map(coords => ({
            type: Constants.geojsonTypes.FEATURE,
            properties: {},
            geometry: {
              type: Constants.geojsonTypes.POINT,
              coordinates: coords
            }
          }));
          var delta = {
            lng: e.lngLat.lng - dragMoveLocation.lng,
            lat: e.lngLat.lat - dragMoveLocation.lat
          };
          var constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);

          for (var i = 0; i < selectedCoords.length; i++) {
            var coord = selectedCoords[i];
            feature.updateCoordinate(selectedCoordPaths[i],
              coord[0] + constrainedDelta.lng,
              coord[1] + constrainedDelta.lat);
          }

          dragMoveLocation = e.lngLat;
        }
      });

      this.on('click', (e) => {
        if (CommonSelectors.noTarget(e) || CommonSelectors.isInactiveFeature(e)) {
          return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
        }
        stopDragging(e);
      });

      this.on('mouseup', e => {
        if (dragMoving) {
          ctx.map.fire(Constants.events.UPDATE, {
            action: Constants.updateActions.CHANGE_COORDINATES,
            features: ctx.store.getSelected().map(f => f.toGeoJSON())
          });
        }
        stopDragging();
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
