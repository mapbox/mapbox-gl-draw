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
    var s = Object.assign({}, style);
    if (s.source) return style;
    s.id = `${s.id}.${sourceBucket}`;
    s.source = `mapbox-gl-draw-${sourceBucket}`;
    return s;
  });
}

module.exports = function(options = {}) {
  var opts = Object.assign({}, options);

  if (!opts.controls) {
    opts.controls = {};
  }

  if (opts.displayControlsDefault === false) {
    opts.controls = Object.assign({}, hideControls, opts.controls);
  } else {
    opts.controls = Object.assign({}, showControls, opts.controls);
  }

  opts = Object.assign({}, defaultOptions, opts);

  // Layers with a shared source should be adjacent for performance reasons
  opts.styles = addSources(opts.styles, 'cold').concat(addSources(opts.styles, 'hot'));
  return opts;
};
