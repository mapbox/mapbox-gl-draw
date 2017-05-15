const xtend = require('xtend');
const Constants = require('./constants');
const themes = require('./lib/theme');

const defaultOptions = {
  defaultMode: Constants.modes.SIMPLE_SELECT,
  keybindings: true,
  touchEnabled: true,
  clickBuffer: 2,
  snapBuffer: 15,
  touchBuffer: 25,
  boxSelect: true,
  snapTo: true,
  displayControlsDefault: true,
  styles: themes.default,
  controls: {},
  userProperties: false,
  snapStyles: ['gl-draw-polygon-stroke-inactive.cold', 'gl-draw-line-inactive.cold', 'gl-draw-point-inactive.cold'],
  snapOverSources: ['mapbox-gl-draw-cold'],
  snapOverStyles: themes.snapOver
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
  return styles.map(style => {
    if (style.source) return style;
    return xtend(style, {
      id: `${style.id}.${sourceBucket}`,
      source: (sourceBucket === 'hot') ? Constants.sources.HOT : Constants.sources.COLD
    });
  });
}

function addSnapOverSources(styles, sources) {
  let snapStyles = [];
  sources.forEach((source) => {
    snapStyles = snapStyles.concat(styles.map(style => {
      if (style.source) return style;
      return xtend(style, {
        id: `${style.id}.${source}`,
        source: `${source}`,
        'source-layer': `${source}`
      });
    }));
  });
  return snapStyles;
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

  //create option snapOver
  withDefaults.snapOver = addSnapOverSources(withDefaults.snapOverStyles, withDefaults.snapOverSources);

  return withDefaults;
};
