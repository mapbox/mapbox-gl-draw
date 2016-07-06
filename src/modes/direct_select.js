var {noFeature, isOfMetaType, isInactiveFeature, isShiftDown} = require('../lib/common_selectors');
var createSupplementaryPoints = require('../lib/create_supplementary_points');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const CommonSelectors = require('../lib/common_selectors');

const isVertex = isOfMetaType(Constants.meta.VERTEX);
const isMidpoint = isOfMetaType(Constants.meta.MIDPOINT);

module.exports = function(ctx, opts) {
  var featureId = opts.featureId;
  var feature = ctx.store.get(featureId);

  if (!feature) {
    throw new Error('You must provide a featureId to enter direct_select mode');
  }

  if (feature.type === Constants.geojsonTypes.POINT) {
    throw new TypeError('direct_select mode doesn\'t handle point features');
  }

  var startPos = opts.startPos || null;
  var coordPos = null;
  var dragging;
  var canDragMove;

  var selectedCoordPaths = opts.coordPath ? [opts.coordPath] : [];

  var onVertex = function(e) {
    startDragging(e);
    var about = e.featureTarget.properties;
    var selectedIndex = selectedCoordPaths.indexOf(about.coord_path);
    if (!isShiftDown(e) && selectedIndex === -1) {
      selectedCoordPaths = [about.coord_path];
    }
    else if (isShiftDown(e) && selectedIndex === -1) {
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
    canDragMove = true;
    startPos = e.lngLat;
  };

  var stopDragging = function() {
    ctx.map.dragPan.enable();
    dragging = false;
    canDragMove = false;
    coordPos = null;
    startPos = null;
  };

  var setupCoordPos = function() {
    coordPos = selectedCoordPaths.map(coord_path => feature.getCoordinate(coord_path));
  };

  return {
    start: function() {
      dragging = false;
      canDragMove = false;
      ctx.store.setSelected(featureId);
      doubleClickZoom.disable(ctx);

      // Anytime the mouse goes down in the active feature, disable dragPan
      this.on('mousedown', e => isVertex(e) || isMidpoint(e), () => {
        ctx.map.dragPan.disable();
      });

      // On mousemove that is not a drag, stop vertex movement.
      this.on('mousemove', CommonSelectors.true, stopDragging);

      this.on('mousedown', isVertex, onVertex);
      this.on('mousedown', isMidpoint, onMidpoint);
      this.on('drag', () => canDragMove, function(e) {
        dragging = true;
        e.originalEvent.stopPropagation();
        if (coordPos === null) {
          setupCoordPos();
        }
        var lngChange = e.lngLat.lng - startPos.lng;
        var latChange = e.lngLat.lat - startPos.lat;

        for (var i = 0; i < coordPos.length; i++) {
          var coord_path = selectedCoordPaths[i];
          var pos = coordPos[i];

          var lng = pos[0] + lngChange;
          var lat = pos[1] + latChange;
          feature.updateCoordinate(coord_path, lng, lat);
        }
      });
      this.on('click', CommonSelectors.true, stopDragging);
      this.on('mouseup', CommonSelectors.true, function() {
        if (dragging) {
          ctx.map.fire(Constants.events.UPDATE, {
            action: Constants.updateActions.CHANGE_COORDINATES,
            features: ctx.store.getSelected().map(f => f.toGeoJSON())
          });
        }
        stopDragging();
      });
      this.on('click', noFeature, function() {
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
