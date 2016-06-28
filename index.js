'use strict';

var Setup = require('./src/setup');
var Options = require('./src/options');
var API = require('./src/api');
const Constants = require('./src/constants');

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
  api.types = Constants.types;
  api.options = options;

  return api;
};

module.exports = Draw;

window.mapboxgl = window.mapboxgl || {};
window.mapboxgl.Draw = Draw;
