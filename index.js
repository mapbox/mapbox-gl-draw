import runSetup from './src/setup';
import setupOptions from './src/options';
import setupAPI from './src/api';
import * as Constants from './src/constants';

const setupDraw = function(options, api) {
  options = setupOptions(options);

  const ctx = {
    options
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

function MapboxDraw(options) {
  setupDraw(options, this);
}

import modes from './src/modes/index';
MapboxDraw.modes = modes;

export default MapboxDraw;
