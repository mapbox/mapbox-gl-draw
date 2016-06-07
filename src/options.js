var hat = require('hat');

const defaultOptions = {
  defaultMode: 'simple_select',
  position: 'top-left',
  keybindings: true,
  clickBuffer: 2,
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

  opts.styles = opts.styles.reduce((memo, style) => {
    style.id = style.id || hat();
    if (style.source) {
      memo.push(style);
    }
    else {
      var id = style.id;
      style.id = `${id}.hot`;
      style.source = 'mapbox-gl-draw-hot';
      memo.push(JSON.parse(JSON.stringify(style)));

      style.id = `${id}.cold`;
      style.source = 'mapbox-gl-draw-cold';
      memo.push(JSON.parse(JSON.stringify(style)));
    }

    return memo;
  }, []);

  return opts;
};
