var {noFeature, isShiftDown, isFeature, isOfMetaType} = require('../lib/common_selectors');
var addCoords = require('../lib/add_coords');

module.exports = function(ctx, startingSelectedFeatureIds) {

  var selectedFeaturesById = {};
  (startingSelectedFeatureIds || []).forEach(id => {
    selectedFeaturesById[id] = ctx.store.get(id);
  });

  var startPos = null;
  var dragging = false;
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
      this.on('click', noFeature, function() {
        var wasSelected = Object.keys(selectedFeaturesById);
        selectedFeaturesById = {};
        wasSelected.forEach(id => this.render(id));
        this.fire('selected.end', {featureIds: wasSelected});
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

        var isSelected = selectedFeaturesById[id] !== undefined;

        if (isSelected && !isShiftDown(e)) {
          this.on('click', readyForDirectSelect, directSelect);
        }
        else if (isSelected && isShiftDown(e)) {
          delete selectedFeaturesById[id];
          this.fire('selected.end', {featureIds:[id]});
          this.render(id);
        }
        else if (!isSelected && isShiftDown(e)) {
          // add to selected
          selectedFeaturesById[id] = ctx.store.get(id);
          this.fire('selected.start', {featureIds:[id]});
          this.render(id);
        }
        else {
          //make selected
          var wasSelected = Object.keys(selectedFeaturesById);
          wasSelected.forEach(id => this.render(id));
          selectedFeaturesById = {};
          selectedFeaturesById[id] = ctx.store.get(id);
          this.fire('selected.end', {featureIds:wasSelected});
          this.fire('selected.start', {featureIds:[id]});
          this.render(id);
        }
      });

      this.on('mouseup', () => true, function() {
        dragging = false;
        featureCoords = null;
        features = null;
        numFeatures = null;
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
        var ringMap = (ring) => ring.map(coord => [coord[0] + lngD, coord[1] + latD]);

        for (var i = 0; i < numFeatures; i++) {
          var feature = features[i];
          if (feature.type === 'Point') {
            feature.setCoordinates([
              featureCoords[i][0] + lngD,
              featureCoords[i][1] + latD
            ]);
          }
          else if (feature.type === 'LineString') {
            feature.setCoordinates(featureCoords[i].map(coordMap));
          }
          else if (feature.type === 'Polygon') {
            feature.setCoordinates(featureCoords[i].map(ringMap));
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
      if (geojson.properties.active === 'true') {
        addCoords(geojson, false, push, ctx.map, []);
      }
      push(geojson);
    }
  };
};
