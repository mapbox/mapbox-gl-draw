import * as Constants from './constants.js';

import styles from './lib/theme.js';
import modes from './modes/index.js';

const defaultOptions = {
  defaultMode: Constants.modes.SIMPLE_SELECT,
  keybindings: true,
  touchEnabled: true,
  clickBuffer: 2,
  touchBuffer: 25,
  boxSelect: true,
  displayControlsDefault: true,
  styles,
  modes,
  controls: {},
  userProperties: false,
  suppressAPIEvents: true
};

const showControls = {
  point: true,
  line_string: true,
  polygon: true,
  trash: true,
  combine_features: true,
  uncombine_features: true
};

const hideControls = {
  point: false,
  line_string: false,
  polygon: false,
  trash: false,
  combine_features: false,
  uncombine_features: false
};

function addSources(styles, sourceBucket) {
  return styles.map((style) => Object.assign({}, style, {
    id: `${style.id}.${sourceBucket}`,
    source: (sourceBucket === 'hot') ? Constants.sources.HOT : Constants.sources.COLD
  }));
}

export default function(options = {}) {
  let withDefaults = Object.assign({}, options);

  if (!options.controls) {
    withDefaults.controls = {};
  }

  if (options.displayControlsDefault === false) {
    withDefaults.controls = Object.assign({}, hideControls, options.controls);
  } else {
    withDefaults.controls = Object.assign({}, showControls, options.controls);
  }

  withDefaults = Object.assign({}, defaultOptions, withDefaults);

  // Layers with a shared source should be adjacent for performance reasons
  const sourcedStyles = withDefaults.styles.filter((style) => style.source);
  const unsourcedStyles = withDefaults.styles.filter((style) => !style.source);
  withDefaults.styles = sourcedStyles
    .concat(addSources(unsourcedStyles, 'cold'))
    .concat(addSources(unsourcedStyles, 'hot'));

  return withDefaults;
}
