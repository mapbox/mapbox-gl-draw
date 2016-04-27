var hat = require('hat');

const defaultOptions = {
  defaultMode: 'simple_select',
  position: 'top-left',
  keybindings: true,
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

module.exports = function(options = {controls: {}}) {

  if (options.displayControlsDefault === false) {
    options.controls = Object.assign(hideControls, options.controls);
  } else {
    options.controls = Object.assign(showControls, options.controls);
  }

  options = Object.assign(defaultOptions, options);

  options.styles = options.styles.reduce((memo, style) => {
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

  return options;
};
