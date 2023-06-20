import runSetup from './src/setup';
import setupOptions from './src/options';
import setupAPI from './src/api';
import * as Constants from './src/constants';
import * as lib from './src/lib';

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

function MapLibreDraw(options) {
  setupDraw(options, this);
}

import modes from './src/modes/index';
MapLibreDraw.modes = modes;
MapLibreDraw.constants = Constants;
MapLibreDraw.lib = lib;

export default MapLibreDraw;
