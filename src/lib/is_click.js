var euclideanDistance = require('./euclidean_distance');

const closeTolerance = 4;
const tolerance = 12;

module.exports = function isClick(start, end){
  start.point = start.point || end.point;
  start.time = start.time || end.time;
  var moveDistance = euclideanDistance(start.point, end.point);
  return moveDistance < closeTolerance || (moveDistance < tolerance && (end.time - start.time) < 500);
};
