
var modes = [
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

