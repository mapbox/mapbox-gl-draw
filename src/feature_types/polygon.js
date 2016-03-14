var Feature =  require('./feature');

var toMidpoint = require('../lib/to_midpoint');
var toVertex = require('../lib/to_vertex');

var Polygon = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
  this.coordinates = this.coordinates.map(coords => coords.slice(0, -1));
  this.selectedCoords = {};
};

Polygon.prototype = Object.create(Feature.prototype);

Polygon.prototype.unselect = function() {
  this.selectedCoords = {};
  Feature.prototype.unselect.call(this);
}

Polygon.prototype.select = function() {
  this.selectedCoords = {};
  Feature.prototype.select.call(this);
}

Polygon.prototype.selectCoordinate = function(path) {
  this.selectedCoords[path] = true;
}

Polygon.prototype.unselectCoordinate = function(path) {
  delete this.selectedCoords[path];
}

Polygon.prototype.deleteSelectedCoords = function() {
  var selectedCoords = this.getSelectedCoordinatePaths();
  this.ctx.store.batch(() => {
    selectedCoords.forEach(path => this.removeCoordinate(path));
  });
}

Polygon.prototype.getSelectedCoordinatePaths = function() {
  return Object.keys(this.selectedCoords);
}

Polygon.prototype.addCoordinate = function(path, lng, lat) {
  this.selectedCoords = {};
  var ids = path.split('.').map(x => parseInt(x, 10));

  var ring = this.coordinates[ids[0]];

  ring.splice(ids[1], 0, [lng, lat]);
  this.ctx.store.render();
}

Polygon.prototype.removeCoordinate = function(path) {
  this.selectedCoords = {};
  var ids = path.split('.').map(x => parseInt(x, 10));
  var ring = this.coordinates[ids[0]];
  if (ring) {
    ring.splice(ids[1], 1);
    if (ring.length < 3) {
      this.coordinates.splice(ids[0], 1);
    }
    this.ctx.store.render();
  }
}

Polygon.prototype.getCoordinate = function(path) {
  var ids = path.split('.').map(x => parseInt(x, 10));
  var ring = this.coordinates[ids[0]];
  return JSON.parse(JSON.stringify(ring[ids[1]]));
}

Polygon.prototype.getCoordinates = function() {
  return this.coordinates.map(coords => coords.concat([coords[0]]));
}

Polygon.prototype.getSourceFeatures = function() {
  var geojson = this.internalGeoJSON();
  var midpoints = [];
  var vertices = [];

  console.log('woot');
  if (this.drawProperties.direct_selected) {
    for (var i = 0; i<geojson.geometry.coordinates.length; i++) {
      var ring = geojson.geometry.coordinates[i];
      for (var j = 0; j<ring.length; j++) {
        var coord = ring[j];
        var path = `${i}.${j}`;
        vertices.push(toVertex(this.id, coord, path, this.selectedCoords[path] || false));

        if (j > 0) {
          var start = vertices[j-1];
          var end = vertices[j];
          midpoints.push(toMidpoint(this.id, start, end, this.ctx.map));
        }
      }
    }
  }

  return [geojson].concat(midpoints).concat(vertices);
}

module.exports = Polygon;

