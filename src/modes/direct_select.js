var {noFeature, isOfMetaType, isShiftDown} = require('../lib/common_selectors');

var toMidpoint = require('../lib/to_midpoint');
var toVertex = require('../lib/to_vertex');

module.exports = function(ctx, featureId) {
  var feature = ctx.store.get(featureId);

  var dragging = false;
  var startPos = null;
  var coordPos = null;
  var numCoords = null;

  var selectedCoordPaths = [];

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

  return {
    start: function() {
      ctx.ui.setClass('mapbox-gl-draw_mouse-direct-select');
      this.on('mousedown', isOfMetaType('vertex'), onVertex);
      this.on('mousedown', isOfMetaType('midpoint'), onMidpoint);
      this.on('drag', () => {
        return dragging;
      }, function(e) {
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
        dragging = false;
        coordPos = null;
        numCoords = null;
        startPos = null;
      });
      this.on('click', (e) => noFeature(e) && selectedCoordPaths.length === 0, function(e) {
        e.originalEvent.stopPropagation();
        ctx.events.changeMode('simple_select', [featureId]);
      });
      this.on('click', e => noFeature(e) && selectedCoordPaths.length > 0, function() {
        selectedCoordPaths = [];
      });
      this.on('trash', () => selectedCoordPaths.length > 0, function() {
        selectedCoordPaths.sort().reverse().forEach(id => feature.removeCoordinate(id));
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
      ctx.ui.clearClass();
    },
    render: function(geojson, push) {
      if (featureId === geojson.properties.id) {
        geojson.properties.active = 'true';
        push(geojson);
        var oneVertex = null;
        var twoVertex = null;
        var startVertex = null;
        for (let i = 0; i < geojson.geometry.coordinates.length; i++) {
          if (feature.type === 'Polygon') {
            let ring = geojson.geometry.coordinates[i];
            for (let j = 0; j < ring.length - 1; j++) {
              let coord = ring[j];
              let coord_path = `${i}.${j}`;

              oneVertex = toVertex(feature.id, coord, coord_path, selectedCoordPaths.indexOf(coord_path) > -1);
              startVertex = startVertex ? startVertex : oneVertex;
              push(oneVertex);

              if (j > 0) {
                push(toMidpoint(feature.id, twoVertex, oneVertex, ctx.map));
              }

              twoVertex = oneVertex;
            }
            push(toMidpoint(feature.id, oneVertex, startVertex, ctx.map));
          }
          else {
            let coord = geojson.geometry.coordinates[i];
            let coord_path = `${i}`;
            oneVertex = toVertex(feature.id, coord, coord_path, selectedCoordPaths.indexOf(coord_path) > -1);
            push(oneVertex);
            if (i > 0) {
              push(toMidpoint(feature.id, twoVertex, oneVertex, ctx.map));
            }
            twoVertex = oneVertex;
          }
        }
      }
      else {
        geojson.properties.active = 'false';
        push(geojson);
      }
    }
  };
};
