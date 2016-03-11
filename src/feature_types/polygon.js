var Feature =  require('./feature');

var drawPolygon = require('../modes/draw_polygon');

var toMidpoint = require('../lib/to_midpoint');
var toVertex = require('../lib/to_vertex');

var Polygon = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
  this.coordinates = this.coordinates.map(coords => coords.slice(0, -1));
};

Polygon.prototype = Object.create(Feature.prototype);

Polygon.prototype.getCoordinates = function() {
  return this.coordinates.map(coords => coords.concat([coords[0]]));
}

Polygon.prototype.getSourceFeatures = function() {
  var geojson = this.internalGeoJSON();
  var midpoints = [];
  var vertices = [];

  for (var i = 0; i<geojson.geometry.coordinates.length; i++) {
    var ring = geojson.geometry.coordinates[i];
    for (var j = 0; j<ring.length; j++) {
      var path = `${i}.${j}`;
      var coord = ring[j];
      vertices.push(toVertex(coord, {
        path: path,
        parent: geojson.id
      }));

      if (j > 0) {
        var start = vertices[j-1];
        var end = vertices[j];
        midpoints.push(toMidpoint(start, end, this.ctx.map));
      }
    }
  }

  return [geojson].concat(midpoints).concat(vertices);
}

Polygon.startDrawing = function(ctx) {
  var geojson = {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[0,0], [0, 0],[0, 0]]]
      }
    }

    var polygon = new Polygon(ctx, geojson);

    ctx.events.startMode(drawPolygon(ctx, polygon));
}

module.exports = Polygon;

