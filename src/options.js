const defaultOptions = {
  drawing: true,
  interactive: false,
  position: 'top-left',
  keybindings: true,
  displayControlsDefault: true,
  styles: {},
  controls: {}
}

const showControls = {
  point: true,
  line: true,
  polygon: true,
  trash: true
};

const hideControls = {
  point: false,
  line: false,
  polygon: false,
  trash: false
};

module.exports = function(options = {controls: {}}) {

  if (options.displayControlsDefault === false) {
    options.controls = Object.assign(hideControls, options.controls);
  } else {
    options.controls = Object.assign(showControls, options.controls);
  }

  return Object.assign(defaultOptions, options);
}
