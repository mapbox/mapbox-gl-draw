var {noFeature, isOfMetaType, isInactiveFeature, isShiftDown} = require('../lib/common_selectors');
var createSupplementaryPoints = require('../lib/create_supplementary_points');

module.exports = function(ctx, opts) {
  var featureId = opts.featureId;
  var feature = ctx.store.get(featureId);

  if (feature.type === 'Point') {
    throw new TypeError('direct_select mode doesn\'t handle point features');
  }

  var dragging = opts.isDragging || false;
  var startPos = opts.startPos || null;
  var coordPos = null;
  var numCoords = null;

  var selectedCoordPaths = opts.coordPath ? [opts.coordPath] : [];

  var onVertex = function(e) {
    dragging = true;
    startPos = e.lngLat;
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
    dragging = true;
    startPos = e.lngLat;
    var about = e.featureTarget.properties;
    feature.addCoordinate(about.coord_path, about.lng, about.lat);
    selectedCoordPaths = [about.coord_path];
  };

  var setupCoordPos = function() {
    coordPos = selectedCoordPaths.map(coord_path => feature.getCoordinate(coord_path));
    numCoords = coordPos.length;
  };

  var emitModify = () => {
    ctx.map.fire('draw.modified', {
      features: [feature]
    });
  };

  return {
    start: function() {
      ctx.store.setSelected(featureId);
      ctx.map.doubleClickZoom.disable();
      this.on('mousedown', isOfMetaType('vertex'), onVertex);
      this.on('mousedown', isOfMetaType('midpoint'), onMidpoint);
      this.on('drag', () => dragging, function(e) {
        e.originalEvent.stopPropagation();
        if (coordPos === null) {
          setupCoordPos();
        }
        var lngChange = e.lngLat.lng - startPos.lng;
        var latChange = e.lngLat.lat - startPos.lat;

        for (var i = 0; i < numCoords; i++) {
          var coord_path = selectedCoordPaths[i];
          var pos = coordPos[i];

          var lng = pos[0] + lngChange;
          var lat = pos[1] + latChange;
          feature.updateCoordinate(coord_path, lng, lat);
        }
      });
      this.on('mouseup', () => true, function() {
        if (dragging) emitModify();
        dragging = false;
        coordPos = null;
        numCoords = null;
        startPos = null;
      });
      this.on('click', noFeature, function() {
        ctx.events.changeMode('simple_select');
      });
      this.on('click', isInactiveFeature, function() {
        ctx.events.changeMode('simple_select');
      });
      this.on('trash', () => selectedCoordPaths.length > 0, function() {
        selectedCoordPaths.sort().reverse().forEach(id => feature.removeCoordinate(id));
        emitModify();
        selectedCoordPaths = [];
        if (feature.isValid() === false) {
          ctx.store.delete([featureId]);
          ctx.events.changeMode('simple_select');
        }
      });
      this.on('trash', () => selectedCoordPaths.length === 0, function() {
        ctx.events.changeMode('simple_select', [featureId]);
      });
    },
    stop: function() {
      ctx.map.doubleClickZoom.enable();
    },
    render: function(geojson, push) {
      if (featureId === geojson.properties.id) {
        geojson.properties.active = 'true';
        push(geojson);
        createSupplementaryPoints(geojson, {
          map: ctx.map,
          midpoints: true,
          selectedPaths: selectedCoordPaths
        }).forEach(push);
      }
      else {
        geojson.properties.active = 'false';
        push(geojson);
      }
    }
  };
};
