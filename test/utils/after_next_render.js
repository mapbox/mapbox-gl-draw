var afterNextRender = function(map) {
  return function(cb) {
    setTimeout(cb, 32);
  }
}
