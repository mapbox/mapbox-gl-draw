var pointOnLine = require('turf-point-on-line');
var distance = require('turf-distance');

var {noFeature, isOfMetaType, isShiftDown} = require('../lib/common_selectors');
var addCoords = require('../lib/add_coords');

module.exports = function(ctx, opts) {
  var featureId = opts.featureId;
  var feature = ctx.store.get(featureId);

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
  };

  var onMidpoint = function(e) {
    dragging = true;
    startPos = e.lngLat;
    var coords = e.featureTarget.geometry.coordinates;

    var pt = pointOnLine(e.featureTarget.geometry, );

    var lines = [];

    for(var i=0; i<coords.length-2; i++) {
      lines.push({
        type: 'Feature',
        property: {
          coord_path: (e.featureTarget.properties.ring_num ? e.featureTarget.properties.ring_num + '.' : '') + i
        },
        geometry: {
          type: 'LineString',
          coordinates: [coords[i], coords[i+1]]
        }
      })
    }

    var clickPoint = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [e.lngLat.lng, e.lngLat.lat]
      }
    };

    lines.map(function(line) {
      var point = pointOnLine(line, clickPoint);
      line.properties.distance = distance(point, clickPoint, 'kilometers');
    }).sort(function(a, b) {
      return a.properties.distance - b.properties.distance;
    });

    console.log(lines);

    feature.addCoordinate(lines[0].properties.coord_path, startPos.lng, startPos.lat);
    selectedCoordPaths = [lines[0].properties.coord_path];
  };

  var setupCoordPos = function() {
    coordPos = selectedCoordPaths.map(coord_path => feature.getCoordinate(coord_path));
    numCoords = coordPos.length;
  };

  return {
    start: function() {
      this.on('mousedown', isOfMetaType('vertex'), onVertex);
      this.on('mousedown', isOfMetaType('border'), onMidpoint);
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
        dragging = false;
        coordPos = null;
        numCoords = null;
        startPos = null;
      });
      this.on('click', noFeature, function() {
        ctx.events.changeMode('simple_select');
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
    stop: function() {},
    render: function(geojson, push) {
      if (featureId === geojson.properties.id) {
        geojson.properties.active = 'true';
        if (geojson.geometry.type === 'LineString') {
          geojson.properties.meta = 'border';
          geojson.geometry.parent = geojson.id;
        }
        else if (geojson.geometry.type === 'Polygon') {
          geojson.properties['has-border'] = 'true';
          geojson.geometry.coordinates.forEach((ring, i) => {
            push({
              type: 'Feature',
              properties: {
                meta: 'border',
                parent: geojson.id,
                ring_num: i
              },
              geometry: {
                type: 'LineString',
                coordinates: ring
              }
            });
          });
        }
        push(geojson);

        addCoords(geojson, push, ctx.map, selectedCoordPaths);

      }
      else {
        geojson.properties.active = 'false';
        push(geojson);
      }
    }
  };
};
