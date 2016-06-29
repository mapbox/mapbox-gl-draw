const xtend = require('xtend');

const defaultOptions = {
  defaultMode: 'simple_select',
  position: 'top-left',
  keybindings: true,
  clickBuffer: 2,
  boxSelect: true,
  displayControlsDefault: true,
  styles: require('./lib/theme'),
  controls: {}
};

const showControls = {
  point: true,
  line_string: true,
  polygon: true,
  trash: true
};

const hideControls = {
  point: false,
  line_string: false,
  polygon: false,
  trash: false
};

function addSources(styles, sourceBucket) {
  return styles.map(style => {
    if (style.source) return style;
    return xtend(style, {
      id: `${style.id}.${sourceBucket}`,
      source: `mapbox-gl-draw-${sourceBucket}`
    });
  });
}

module.exports = function(options = {}) {
  let withDefaults = xtend(options);

  if (!options.controls) {
    withDefaults.controls = {};
  }

  if (options.displayControlsDefault === false) {
    withDefaults.controls = xtend(hideControls, options.controls);
  } else {
    withDefaults.controls = xtend(showControls, options.controls);
  }

  withDefaults = xtend(defaultOptions, withDefaults);

  // Layers with a shared source should be adjacent for performance reasons
  withDefaults.styles = addSources(withDefaults.styles, 'cold').concat(addSources(withDefaults.styles, 'hot'));

  return withDefaults;
};
