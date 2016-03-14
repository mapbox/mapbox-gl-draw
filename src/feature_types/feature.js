var hat = require('hat');

var Feature = function(ctx, geojson) {
  this.ctx = ctx;
  this.userProperties = geojson.properties || {};
  this.coordinates = geojson.geometry.coordinates;
  this.id = geojson.id || hat();
  this.type = geojson.geometry.type;

  this.drawProperties = {
    id: this.id,
    type: this.type,
    meta: 'feature',
    selected: false,
    direct_selected: false
  }

  ctx.store.add(this);
}

Feature.prototype.updateCoordinate = function(path, lng, lat) {
  path = path + '';
  var ids = path === '' ? [] : path.split('.').map(x => parseInt(x, 10));
  if (this.coordinates[ids[0]] === undefined && ids.length > 0) {
    this.coordinates[ids[0]] = []
  }
  var coordinate = ids.length === 0 ? this.coordinates : (this.coordinates[ids[0]] || []);
  for(var i=1; i<ids.length; i++) {
    if (coordinate[ids[i]] === undefined) {
      coordinate.push([]);
    }
    coordinate = coordinate[ids[i]];
  }
  coordinate[0] = lng;
  coordinate[1] = lat;
  this.ctx.store.render();
}

Feature.prototype.isSelected = function() {
  return this.drawProperties.selected === 'true';
}

Feature.prototype.select = function() {
  this.drawProperties.selected = 'true';
  this.ctx.store.render();
}

Feature.prototype.unselect = function() {
  this.drawProperties.selected = 'false';
  this.ctx.store.render();
}

Feature.prototype.update = function(geojson) {
  this.userProperties = geojson.properties || this.userProperties;
  this.coordinates = geojson.coordinates || geojson.geometry.coordinates;
  this.ctx.store.render();
}

Feature.prototype.getCoordinates = function() {
  return JSON.parse(JSON.stringify(this.coordinates));
}

Feature.prototype.toGeoJSON = function() {
  return JSON.parse(JSON.stringify({
    "id": this.id,
    "type": "Feature",
    "properties": this.userProperties,
    "geometry": {
      "coordinates": this.getCoordinates(),
      "type": this.type
    }
  }));
}

Feature.prototype.internalGeoJSON = function() {
    return {
      "id": this.id,
      "type": "Feature",
      "properties": this.drawProperties,
      "geometry": {
        "coordinates": this.getCoordinates(),
        "type": this.type
      }
    }
}

Feature.prototype.getSourceFeatures = function() {
  return [this.internalGeoJSON()];
}

module.exports = Feature;
