const runSetup = require('./src/setup');
const setupOptions = require('./src/options');
const setupAPI = require('./src/api');
const Constants = require('./src/constants');

const setupDraw = function(options, api) {
  options = setupOptions(options);

  const ctx = {
    options: options
  };

  api = setupAPI(ctx, api);
  ctx.api = api;

  const setup = runSetup(ctx);

  api.onAdd = setup.onAdd;
  api.onRemove = setup.onRemove;
  api.types = Constants.types;
  api.options = options;

  return api;
};

module.exports = function(options) {
  setupDraw(options, this);
};

module.exports.modes = require('./src/modes');
