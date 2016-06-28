var {noFeature, isShiftDown, isFeature, isOfMetaType, isShiftMousedown, isActiveFeature} = require('../lib/common_selectors');
var mouseEventPoint = require('../lib/mouse_event_point');
var featuresAt = require('../lib/features_at');
var createSupplementaryPoints = require('../lib/create_supplementary_points');
var StringSet = require('../lib/string_set');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');

module.exports = function(ctx, options = {}) {
  var startPos = null;
  var featureCoords = null;
  var startCoordinates = null;
  var box;
  var boxSelecting = false;
  var dragging;
  var canDragMove;

  const initiallySelectedFeatureIds = options.featureIds || [];

  function getUniqueIds(allFeatures) {
    if (!allFeatures.length) return [];
    var ids = allFeatures.map(s => s.properties.id)
      .filter(id => id !== undefined)
      .reduce((memo, id) => {
        memo.add(id);
        return memo;
      }, new StringSet());

    return ids.values();
  }

  var cleanupBoxSelect = function() {
    boxSelecting = false;
    setTimeout(() => {
      ctx.map.dragPan.enable();
    }, 0);
  };

  var finishBoxSelect = function(bbox, context) {
    if (box && box.parentNode) {
      box.parentNode.removeChild(box);
      box = null;
    }

    // If bbox exists, use to select features
    if (bbox) {
      var featuresInBox = featuresAt(null, bbox, ctx);
      var ids = getUniqueIds(featuresInBox)
        .filter(id => !ctx.store.isSelected(id));

      if (ids.length) {
        ctx.store.select(ids);
        ids.forEach(id => {
          context.render(id);
        });
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
      }
    }
    cleanupBoxSelect();
  };

  var readyForDirectSelect = function(e) {
    var about = e.featureTarget.properties;
    return ctx.store.isSelected(about.id) && ctx.store.get(about.id).type !== 'Point';
  };

  var buildFeatureCoords = function() {
    var featureIds = ctx.store.getSelectedIds();
    featureCoords = featureIds.map(id => ctx.store.get(id).getCoordinates());
  };

  return {
    stop: function() {
      doubleClickZoom.enable(ctx);
    },
    start: function() {
      dragging = false;
      canDragMove = false;
      // Select features that should start selected,
      // probably passed in from a `draw_*` mode
      if (ctx.store) ctx.store.setSelected(initiallySelectedFeatureIds);

      // Any mouseup should stop box selecting and dragging
      this.on('mouseup', () => true, function() {
        dragging = false;
        canDragMove = false;
        if (boxSelecting) {
          cleanupBoxSelect();
        }
      });

      // When a click falls outside any features,
      // - clear the selection
      // - re-render the deselected features
      // - enable double-click zoom
      this.on('click', noFeature, function() {
        var wasSelected = ctx.store.getSelectedIds();
        ctx.store.clearSelected();
        wasSelected.forEach(id => this.render(id));
        doubleClickZoom.enable(ctx);
      });

      this.on('click', isOfMetaType('vertex'), function(e) {
        ctx.events.changeMode(Constants.modes.DIRECT_SELECT, {
          featureId: e.featureTarget.properties.parent,
          coordPath: e.featureTarget.properties.coord_path,
          startPos: e.lngLat
        });
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
      });

      if (ctx.options.boxSelect) {
        this.on('mousedown', isShiftMousedown, function(e) {
          ctx.map.dragPan.disable();
          startCoordinates = mouseEventPoint(e.originalEvent, ctx.container);
          boxSelecting = true;
        });
      }

      this.on('mousedown', isActiveFeature, function(e) {
        this.render(e.featureTarget.properties.id);
        canDragMove = true;
        startPos = e.lngLat;
      });

      this.on('click', isFeature, function(e) {
        doubleClickZoom.disable(ctx);
        var id = e.featureTarget.properties.id;
        var featureIds = ctx.store.getSelectedIds();
        if (readyForDirectSelect(e) && !isShiftDown(e)) {
          ctx.events.changeMode(Constants.modes.DIRECT_SELECT, {
            featureId: e.featureTarget.properties.id
          });
        }
        else if (ctx.store.isSelected(id) && isShiftDown(e)) {
          ctx.store.deselect(id);
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
          this.render(id);
          if (featureIds.length === 1 ) {
            doubleClickZoom.enable(ctx);
          }
        }
        else if (!ctx.store.isSelected(id) && isShiftDown(e)) {
          // add to selected
          ctx.store.select(id);
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
          this.render(id);
        }
        else if (!ctx.store.isSelected(id) && !isShiftDown(e)) {
          // make selected
          featureIds.forEach(formerId => this.render(formerId));
          ctx.store.setSelected(id);
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
          this.render(id);
        }
      });

      this.on('drag', () => boxSelecting, function(e) {
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
        if (!box) {
          box = document.createElement('div');
          box.classList.add('mapbox-gl-draw_boxselect');
          ctx.container.appendChild(box);
        }
        var current = mouseEventPoint(e.originalEvent, ctx.container);
        var minX = Math.min(startCoordinates.x, current.x),
          maxX = Math.max(startCoordinates.x, current.x),
          minY = Math.min(startCoordinates.y, current.y),
          maxY = Math.max(startCoordinates.y, current.y);

        // Adjust width and xy position of the box element ongoing
        var pos = 'translate(' + minX + 'px,' + minY + 'px)';
        box.style.transform = pos;
        box.style.WebkitTransform = pos;
        box.style.width = maxX - minX + 'px';
        box.style.height = maxY - minY + 'px';
      });

      this.on('drag', () => canDragMove, function(e) {
        dragging = true;
        e.originalEvent.stopPropagation();

        if (featureCoords === null) {
          buildFeatureCoords();
        }

        var lngD = e.lngLat.lng - startPos.lng;
        var latD = e.lngLat.lat - startPos.lat;

        var coordMap = (coord) => [coord[0] + lngD, coord[1] + latD];
        var ringMap = (ring) => ring.map(coord => coordMap(coord));
        var mutliMap = (multi) => multi.map(ring => ringMap(ring));

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
            feature.incomingCoords(featureCoords[i].map(mutliMap));
          }
        });
      });

      this.on('mouseup', () => true, function(e) {
        if (dragging) {
          ctx.map.fire(Constants.events.UPDATE, {
            action: Constants.updateActions.MOVE,
            features: ctx.store.getSelected().map(f => f.toGeoJSON())
          });
          dragging = false;
        }
        if (boxSelecting) {
          finishBoxSelect([
            startCoordinates,
            mouseEventPoint(e.originalEvent, ctx.container)
          ], this);
        }
        canDragMove = false;
        featureCoords = null;
      });
    },
    render: function(geojson, push) {
      geojson.properties.active = ctx.store.isSelected(geojson.properties.id) ? 'true' : 'false';
      push(geojson);
      if (geojson.properties.active !== 'true' || geojson.geometry.type === 'Point') return;
      createSupplementaryPoints(geojson).forEach(push);
    },
    trash() {
      featureCoords = null;
      ctx.store.delete(ctx.store.getSelectedIds());
    }
  };
};
