export default function(map) {
  var render = 0;
  map.on('draw.render', function() {
    render++;
  });
  return function(cb) {
    var lastRender = render;
    var id = setInterval(function() {
      if (lastRender < render) {
        clearInterval(id);
        cb();
      }
    });
  };
}
