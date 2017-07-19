
const modes = [
  'simple_select',
  'direct_select',
  'draw_point',
  'draw_polygon',
  'draw_line_string'
];

module.exports = modes.reduce((m, k) => {
  m[k] = require(`./${k}`);
  return m;
}, {});

module.exports = {
  simple_select: require('./simple_select'),
  direct_select: require('./direct_select'),
  draw_point: require('./draw_point'),
  draw_polygon: require('./draw_polygon'),
  draw_line_string: require('./draw_line_string'),
};

