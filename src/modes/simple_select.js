var {noFeature, isShiftDown, isFeature, isOfMetaType} = require('../lib/common_selectors');
var addCoords = require('../lib/add_coords');

module.exports = function(ctx, startingSelectedFeatureIds) {

  var selectedFeaturesById = {};
  (startingSelectedFeatureIds || []).forEach(id => {
    selectedFeaturesById[id] = ctx.store.get(id);
  });

  var startPos = null;
  var dragging = null;
  var featureCoords = null;
  var features = null;
  var numFeatures = null;


  var readyForDirectSelect = function(e) {
    if (isFeature(e)) {
      var about = e.featureTarget.properties;
      return selectedFeaturesById[about.id] !== undefined && selectedFeaturesById[about.id].type !== 'Point';
    }
    return false;
  };

  var buildFeatureCoords = function() {
    var featureIds = Object.keys(selectedFeaturesById);
    featureCoords = featureIds.map(id => selectedFeaturesById[id].getCoordinates());
    features = featureIds.map(id => selectedFeaturesById[id]);
    numFeatures = featureIds.length;
  };

  var directSelect = function(e) {
    ctx.api.changeMode('direct_select', {
      featureId: e.featureTarget.properties.id
    });
  };

  return {
    start: function() {
      dragging = false;
      this.on('click', noFeature, function() {
        var wasSelected = Object.keys(selectedFeaturesById);
        selectedFeaturesById = {};
        this.fire('selected.end', {featureIds: wasSelected});
        wasSelected.forEach(id => this.render(id));
      });

      this.on('mousedown', isOfMetaType('vertex'), function(e) {
        ctx.api.changeMode('direct_select', {
          featureId: e.featureTarget.properties.parent,
          coordPath: e.featureTarget.properties.coord_path,
          isDragging: true,
          startPos: e.lngLat
        });
      });

      this.on('mousedown', isFeature, function(e) {
        dragging = true;
        startPos = e.lngLat;
        var id = e.featureTarget.properties.id;
        var featureIds = Object.keys(selectedFeaturesById);
        var isSelected = selectedFeaturesById[id] !== undefined;

        if (isSelected && !isShiftDown(e)) {
          if (featureIds.length > 1) {
            this.fire('selected.end', {featureIds: featureIds.filter(f => f !== id)});
          }
          this.on('click', readyForDirectSelect, directSelect);
        }
        else if (isSelected && isShiftDown(e)) {
          delete selectedFeaturesById[id];
          this.fire('selected.end', {featureIds: [id]});
          this.render(id);
        }
        else if (!isSelected && isShiftDown(e)) {
          // add to selected
          selectedFeaturesById[id] = ctx.store.get(id);
          this.fire('selected.start', {featureIds: [id]});
          this.render(id);
        }
        else {
          // make selected
          featureIds.forEach(formerId => this.render(formerId));
          selectedFeaturesById = {};
          selectedFeaturesById[id] = ctx.store.get(id);
          this.fire('selected.end', {featureIds: featureIds});
          this.fire('selected.start', {featureIds: [id]});
          this.render(id);
        }
      });

      this.on('mouseup', () => true, function() {
        dragging = false;
        featureCoords = null;
        features = null;
        numFeatures = null;
      });

      var isDragging = function() {
        return dragging;
      };

      this.on('drag', isDragging, function(e) {
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
        ctx.store.delete(Object.keys(selectedFeaturesById));
        selectedFeaturesById = {};
      });
    },
    render: function(geojson, push) {
      geojson.properties.active = selectedFeaturesById[geojson.properties.id] ? 'true' : 'false';
      if (geojson.properties.active === 'true' && geojson.geometry.type !== 'Point') {
        addCoords(geojson, false, push, ctx.map, []);
      }
      push(geojson);
    }
  };
};
