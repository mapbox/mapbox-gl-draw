var Feature =  require('./feature');

var drawLine = require('../modes/draw_line');

var toMidpoint = require('../lib/to_midpoint');
var toVertex = require('../lib/to_vertex');

var LineString = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
};

LineString.prototype = Object.create(Feature.prototype);

LineString.prototype.getSourceFeatures = function() {
  var geojson = this.internalGeoJSON();
  var midpoints = [];
  var vertices = [];

  for (var i = 0; i<geojson.geometry.coordinates.length; i++) {
    var coord = geojson.geometry.coordinates[i];
    vertices.push(toVertex(coord, {
      path: ''+i,
      parent: geojson.id
    }));

    if (i > 0) {
      var start = vertices[i-1];
      var end = vertices[i];
      midpoints.push(toMidpoint(start, end, this.ctx.map));
    }
  }

  return [geojson].concat(midpoints).concat(vertices);
}

LineString.startDrawing = function(ctx) {
  var geojson = {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "LineString",
        "coordinates": [[0, 0],[0, 0]]
      }
    }

    var line = new LineString(ctx, geojson);

    ctx.events.startMode(drawLine(ctx, line));
}

module.exports = LineString;

