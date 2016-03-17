module.exports = function(start) {
  var path = [];

  for (var i = 0; i<7; i+=.04) {
    var A = 3;
    var B = Math.PI/2;
    var SIZE = 100;
    var OFFSET = 5;

    var x = start.x + (Math.sin(i) * SIZE) + (i*OFFSET);
    var y = start.y + (Math.sin(A*i + B) * SIZE) + (i*OFFSET);

    var point = {
      x: x,
      y: y
    }

    path.push(point);
  }

  return path;
}
