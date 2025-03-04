import runSetup from './src/setup';
import setupOptions from './src/options';
import setupAPI from './src/api';
import modes from './src/modes/index';
import * as Constants from './src/constants';
import * as lib from './src/lib/index';
import type { Controls, DrawLayer } from './src/types/types'

interface Options {
  keybindings: boolean;
  touchEnabled: boolean;
  boxSelect: boolean;
  clickBuffer: number;
  touchBuffer: number;
  controls: Controls;
  displayControlsDefault: boolean;
  styles: Array<DrawLayer>
}

const setupDraw = (options: Options, api) => {
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

function MapboxDraw(options: Options) {
  setupDraw(options, this);
}

MapboxDraw.modes = modes;
MapboxDraw.constants = Constants;
MapboxDraw.lib = lib;

export default MapboxDraw;
