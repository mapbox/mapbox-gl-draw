'use strict';

require('./src/lib/polyfills');
var Setup = require('./src/setup');
var API = require('./src/api');

var Draw = module.exports = function(options) {
  options = Options(options);

  var context = {
    options: options
  };

  var api = new API(context);
  context.api = api;

  Setup(context);

  return api;
}
