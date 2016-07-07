// It's going to be a mix of direct_select mode and simple_select mode
// The main purpose - to be able resize and drag features in the same mode

let { noFeature, isOfMetaType, isInactiveFeature, isShiftDown, isActiveFeature } = require('../lib/common_selectors');
let createSupplementaryPoints = require('../lib/create_supplementary_points');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');

module.exports = function (ctx, opts) {
  let featureId = opts.featureId;
  let feature = ctx.store.get(featureId);

  if (!feature) {
    throw new Error('You must provide a featureId to enter single_feature_select mode');
  }

  if (feature.type === 'Point') {
    throw new TypeError('single_feature_select mode doesn\'t handle point features');
  }

  let startPos = opts.startPos || null;
  let coordPos = null;
  let dragging;
  let canDragMove;

  // what are we dragging: vertex, midpoint or the whole feature
  let dragMode = null;
  let featureCoords = null;

  let buildFeatureCoords = function () {
    let featureIds = ctx.store.getSelectedIds();
    featureCoords = featureIds.map(id => ctx.store.get(id).getCoordinates());
  };

  let selectedCoordPaths = opts.coordPath ? [opts.coordPath] : [];

  let onVertex = function (e) {
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

  let onMidpoint = function (e) {
    startDragging(e);

    dragMode = 'midpoint';

    let about = e.featureTarget.properties;
    feature.addCoordinate(about.coord_path, about.lng, about.lat);
    ctx.map.fire(Constants.events.UPDATE, {
      action  : Constants.updateActions.CHANGE_COORDINATES,
      features: ctx.store.getSelected().map(f => f.toGeoJSON())
    });
    selectedCoordPaths = [about.coord_path];
  };

  let startDragging = function (e) {
    canDragMove = true;
    startPos = e.lngLat;
  };

  let stopDragging = function () {
    dragging = false;
    canDragMove = false;
    coordPos = null;
    startPos = null;

    dragMode = null;
    featureCoords = null;
  };

  let setupCoordPos = function () {
    coordPos = selectedCoordPaths.map(coord_path => feature.getCoordinate(coord_path));
  };

  return {
    start : function () {
      dragging = false;
      canDragMove = false;
      ctx.store.setSelected(featureId);
      doubleClickZoom.disable(ctx);
      this.on('mousedown', isOfMetaType('vertex'), onVertex);
      this.on('mousedown', isOfMetaType('midpoint'), onMidpoint);

      this.on('mousedown', isActiveFeature, function (e) {
        dragMode = 'feature';
        this.render(e.featureTarget.properties.id);
        canDragMove = true;
        startPos = e.lngLat;
      });

      this.on('drag', () => canDragMove, function (e) {

        if (dragMode === 'vertex' || dragMode === 'midpoint') {
          dragging = true;
          e.originalEvent.stopPropagation();
          if (coordPos === null) {
            setupCoordPos();
          }
          let lngChange = e.lngLat.lng - startPos.lng;
          let latChange = e.lngLat.lat - startPos.lat;

          for (let i = 0; i < coordPos.length; i++) {
            let coord_path = selectedCoordPaths[i];
            let pos = coordPos[i];

            let lng = pos[0] + lngChange;
            let lat = pos[1] + latChange;
            feature.updateCoordinate(coord_path, lng, lat);
          }

        } else if (dragMode === 'feature') {
          dragging = true;
          e.originalEvent.stopPropagation();

          if (featureCoords === null) {
            buildFeatureCoords();
          }

          let lngD = e.lngLat.lng - startPos.lng;
          let latD = e.lngLat.lat - startPos.lat;

          let coordMap = (coord) => [coord[0] + lngD, coord[1] + latD];
          let ringMap = (ring) => ring.map(coord => coordMap(coord));
          let multiMap = (multi) => multi.map(ring => ringMap(ring));

          const selectedFeatures = ctx.store.getSelected();

          selectedFeatures.forEach((feature, i) => {
            if (feature.type === 'Point') {
              feature.incomingCoords(coordMap(featureCoords[i]));
            }
            else if (feature.type === 'LineString' || feature.type === 'MultiPoint') {
              feature.incomingCoords(featureCoords[i].map(coordMap));
            }
            else if (feature.type === 'Polygon' || feature.type === 'MultiLineString') {
              feature.incomingCoords(featureCoords[i].map(ringMap));
            }
            else if (feature.type === 'MultiPolygon') {
              feature.incomingCoords(featureCoords[i].map(multiMap));
            }
          });
        }
      });


      this.on('click', () => true, function () {
        stopDragging();
      });

      this.on('mouseup', () => true, function () {

        console.log('dragging', dragging);

        if (dragging) {
          ctx.map.fire(Constants.events.UPDATE, {
            action  : Constants.updateActions.CHANGE_COORDINATES,
            features: ctx.store.getSelected().map(f => f.toGeoJSON())
          });
        }
        stopDragging();
      });

      this.on('click', noFeature, function () {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });

      this.on('click', isInactiveFeature, function () {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
    },
    stop  : function () {
      doubleClickZoom.enable(ctx);
    },
    render: function (geojson, push) {
      if (featureId === geojson.properties.id) {
        geojson.properties.active = 'true';
        push(geojson);
        createSupplementaryPoints(geojson, {
          map          : ctx.map,
          midpoints    : true,
          selectedPaths: selectedCoordPaths
        }).forEach(push);
      }
      else {
        geojson.properties.active = 'false';
        push(geojson);
      }
    },
    trash : function () {
      if (selectedCoordPaths.length === 0) {
        return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { features: [feature] });
      }

      selectedCoordPaths.sort().reverse().forEach(id => feature.removeCoordinate(id));
      ctx.map.fire(Constants.events.UPDATE, {
        action  : Constants.updateActions.CHANGE_COORDINATES,
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
