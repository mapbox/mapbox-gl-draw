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
  marker: true,
  line: true,
  shape: true,
  square: true,
  trash: true
};

const hideControls = {
  marker: false,
  line: false,
  shape: false,
  square: false,
  trash: false
};

module.exports = function(options = {controls: {}}) {

  if (options.displayControlsDefault === false) {
    options.controls = Object.assign(hideControls, options.controls);
  } else {
    options.controls = Object.assign(showControls, options.controls);
  }

  Object.assign(defaultOptions, options);

  return options;
}
