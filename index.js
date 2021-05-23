import runSetup from './src/setup';
import setupOptions from './src/options';
import setupAPI from './src/api';
import * as Constants from './src/constants';
import * as CommonSelectors from './src/lib/common_selectors';
import constrainFeatureMovement from './src/lib/constrain_feature_movement';
import createSupplementaryPoints from './src/lib/create_supplementary_points';
import createVertex from './src/lib/create_vertex';
import doubleClickZoom from './src/lib/double_click_zoom';
import featuresAt from './src/lib/features_at';
import isEventAtCoordinates from './src/lib/is_event_at_coordinates';
import mouseEventPoint from './src/lib/mouse_event_point';
import moveFeatures from './src/lib/move_features';
import StringSet from './src/lib/string_set';

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

export {
  Constants,
  CommonSelectors,
  constrainFeatureMovement,
  createSupplementaryPoints,
  createVertex,
  doubleClickZoom,
  featuresAt,
  isEventAtCoordinates,
  mouseEventPoint,
  moveFeatures,
  StringSet
};

export default MapboxDraw;
