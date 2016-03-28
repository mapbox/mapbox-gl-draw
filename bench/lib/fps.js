module.exports = function() {
  var frameCount = 0;
  var start = null;
  var running = false;

  var frameCounter = function() {
    if(running) {
      frameCount++;
      requestAnimationFrame(frameCounter);
    }
  }

  return {
    start: function() {
      running = true;
      start = performance.now();
      requestAnimationFrame(frameCounter);
    },
    stop: function() {
      var end = performance.now();
      return frameCount / ((end - start) / 1000);
    }
  }
}
