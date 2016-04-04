'use strict';

require('./src/lib/polyfills');
var Setup = require('./src/setup');
var Options = require('./src/options');
var API = require('./src/api');
const types = require('./src/lib/types');

var Draw = function(options) {
  options = Options(options);

  var ctx = {
    options: options
  };

  var api = API(ctx);
  ctx.api = api;

  var setup = Setup(ctx);
  api.addTo = setup.addTo;
  api.remove = setup.remove;
  api.types = types;
  api.options = options;

  return api;
};

module.exports = Draw;

window.mapboxgl = window.mapboxgl || {};
window.mapboxgl.Draw = Draw;
