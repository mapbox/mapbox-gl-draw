var precision = 1e6;

module.exports = function(point) {
  point.lng = Math.floor(point.lng * precision) / precision;
  point.lat = Math.floor(point.lat * precision) / precision;
  return point;
}
