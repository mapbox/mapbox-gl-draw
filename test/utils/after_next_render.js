export default function(map) {
  let render = 0;
  map.on('draw.render', () => {
    render++;
  });
  return function(cb) {
    const lastRender = render;
    const id = setInterval(() => {
      if (lastRender < render) {
        clearInterval(id);
        cb();
      }
    });
  };
}
