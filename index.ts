import runSetup from './src/setup';
import setupOptions from './src/options';
import setupAPI from './src/api';
import * as modes from './src/modes/index';
import * as Constants from './src/constants';
import * as lib from './src/lib/index';
import type { DrawOptions, Draw } from './src/types/types';

const setupDraw = (options: DrawOptions, api: Draw) => {
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

function MapboxDraw(options: DrawOptions) {
  console.log('THIS??', this);

  setupDraw(options, this);
}

MapboxDraw.modes = modes;
MapboxDraw.constants = Constants;
MapboxDraw.lib = lib;

export default MapboxDraw;
