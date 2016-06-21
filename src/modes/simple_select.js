var {noFeature, isShiftDown, isFeature, isOfMetaType, isBoxSelecting, isActiveFeature} = require('../lib/common_selectors');
var mouseEventPoint = require('../lib/mouse_event_point');
var featuresAt = require('../lib/features_at');
var createSupplementaryPoints = require('../lib/create_supplementary_points');

module.exports = function(ctx, startingSelectedIds) {
  var startPos = null;
  var dragging = null;
  var featureCoords = null;
  var startCoordinates = null;
  var features = null;
  var numFeatures = null;
  var box;
  var boxSelecting = false;

  function getUniqueIds(allFeatures) {
    if (!allFeatures.length) return [];
    return allFeatures.map(s => s.properties.id).filter(function(item, pos, ary) {
      return item && (!pos || item !== ary[pos - 1]);
    });
  }

  var finishBoxSelect = function(bbox, context) {
    if (box) {
      box.parentNode.removeChild(box);
      box = null;
    }

    // If bbox exists, use to select features
    if (bbox) {
      var featuresInBox = featuresAt(null, bbox, ctx);
      if (featuresInBox.length >= 1000) return ctx.map.dragPan.enable();
      var ids = getUniqueIds(featuresInBox)
        .filter(id => !ctx.store.isSelected(id));

      if (ids.length) {
        ids.forEach(id => {
          ctx.store.select(id);
          context.render(id);
        });
        context.fire('selected.start', {featureIds: ids});
        ctx.ui.queueContainerClasses({mouse:'move'});
      }
    }
    boxSelecting = false;
    setTimeout(() => {
      ctx.map.dragPan.enable();
    }, 0);
  };

  var readyForDirectSelect = function(e) {
    if (isFeature(e)) {
      var about = e.featureTarget.properties;
      return ctx.store.isSelected(about.id)
        && ctx.store.get(about.id).type !== 'Point';
    }
    return false;
  };

  var buildFeatureCoords = function() {
    var featureIds = ctx.store.getSelectedIds();
    featureCoords = featureIds.map(id => ctx.store.get(id).coordinates);
    features = featureIds.map(id => ctx.store.get(id));
    numFeatures = featureIds.length;
  };

  var directSelect = function(e) {
    ctx.api.changeMode('direct_select', {
      featureId: e.featureTarget.properties.id
    });
  };

  return {
    stop: function() {
      ctx.map.doubleClickZoom.enable();
    },
    start: function() {
      if (ctx.store) {
        ctx.store.setSelected(startingSelectedIds);
      }

      dragging = false;
      this.on('click', noFeature, function() {
        var wasSelected = ctx.store.getSelectedIds();
        ctx.store.clearSelected();
        this.fire('selected.end', {featureIds: wasSelected});
        wasSelected.forEach(id => this.render(id));
        ctx.map.doubleClickZoom.enable();
      });

      this.on('click', isOfMetaType('vertex'), function(e) {
        ctx.api.changeMode('direct_select', {
          featureId: e.featureTarget.properties.parent,
          coordPath: e.featureTarget.properties.coord_path,
          isDragging: true,
          startPos: e.lngLat
        });
        ctx.ui.queueContainerClasses({mouse:'move'});
      });

      if (ctx.options.boxSelect) {
        this.on('mousedown', isBoxSelecting, function(e) {
          ctx.map.dragPan.disable();
          startCoordinates = mouseEventPoint(e.originalEvent, ctx.container);
          boxSelecting = true;
        });
      }

      this.on('mousedown', isActiveFeature, function(e) {
        startPos = e.lngLat;
        dragging = true;
      });

      this.on('click', isFeature, function(e) {
        ctx.map.doubleClickZoom.disable();
        var id = e.featureTarget.properties.id;
        var featureIds = ctx.store.getSelectedIds();
        if (ctx.store.isSelected(id) && !isShiftDown(e)) {
          if (featureIds.length > 1) {
            this.fire('selected.end', {featureIds: featureIds.filter(f => f !== id)});
          }
          this.on('click', readyForDirectSelect, directSelect);
          ctx.ui.queueContainerClasses({mouse:'pointer'});
        }
        else if (ctx.store.isSelected(id) && isShiftDown(e)) {
          ctx.store.deselect(id);
          this.fire('selected.end', {featureIds: [id]});
          ctx.ui.queueContainerClasses({mouse:'pointer'});
          this.render(id);
          if (featureIds.length === 1 ) {
            ctx.map.doubleClickZoom.enable();
          }
        }
        else if (!ctx.store.isSelected(id) && isShiftDown(e)) {
          // add to selected
          ctx.store.select(id);
          this.fire('selected.start', {featureIds: [id]});
          ctx.ui.queueContainerClasses({mouse:'move'});
          this.render(id);
        }
        else if (!ctx.store.isSelected(id) && !isShiftDown(e)) {
          // make selected
          featureIds.forEach(formerId => this.render(formerId));
          ctx.store.clearSelected();
          ctx.store.select(id);
          ctx.ui.queueContainerClasses({mouse:'move'});
          this.fire('selected.end', {featureIds: featureIds});
          this.fire('selected.start', {featureIds: [id]});
          this.render(id);
        }
      });

      this.on('drag', () => boxSelecting, function(e) {
        ctx.ui.queueContainerClasses({mouse:'add'});
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

      this.on('mouseup', () => true, function(e) {
        dragging = false;
        featureCoords = null;
        features = null;
        numFeatures = null;
        if (boxSelecting) {
          finishBoxSelect([
            startCoordinates,
            mouseEventPoint(e.originalEvent, ctx.container)
          ], this);
        }
      });

      this.on('drag', () => dragging, function(e) {
        this.off('click', readyForDirectSelect, directSelect);
        e.originalEvent.stopPropagation();

        if (featureCoords === null) {
          buildFeatureCoords();
        }

        var lngD = e.lngLat.lng - startPos.lng;
        var latD = e.lngLat.lat - startPos.lat;

        var coordMap = (coord) => [coord[0] + lngD, coord[1] + latD];
        var ringMap = (ring) => ring.map(coord => coordMap(coord));
        var mutliMap = (multi) => multi.map(ring => ringMap(ring));

        for (var i = 0; i < numFeatures; i++) {
          var feature = features[i];
          if (feature.type === 'Point') {
            feature.setCoordinates(coordMap(featureCoords[i]));
          }
          else if (feature.type === 'LineString' || feature.type === 'MultiPoint') {
            feature.setCoordinates(featureCoords[i].map(coordMap));
          }
          else if (feature.type === 'Polygon' || feature.type === 'MultiLineString') {
            feature.setCoordinates(featureCoords[i].map(ringMap));
          }
          else if (feature.type === 'MultiPolygon') {
            feature.setCoordinates(featureCoords[i].map(mutliMap));
          }
        }
      });

      this.on('trash', () => true, function() {
        dragging = false;
        featureCoords = null;
        features = null;
        numFeatures = null;
        ctx.store.delete(ctx.store.getSelectedIds());
      });
    },
    render: function(geojson, push) {
      geojson.properties.active = ctx.store.isSelected(geojson.properties.id) ? 'true' : 'false';
      push(geojson);
      if (geojson.properties.active !== 'true' || geojson.geometry.type === 'Point') return;
      createSupplementaryPoints(geojson).forEach(push);
    }
  };
};
