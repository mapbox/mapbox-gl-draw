const ModeInterface = require('./mode_interface');

module.exports = function(modeObject) {
  const modeObjectKeys = Object.keys(modeObject);

  return function(ctx, startOpts = {}) {
    let state = {};

    const mode = modeObjectKeys.reduce((m, k) => {
      m[k] = modeObject[k];
      return m;
    }, new ModeInterface(ctx));

    function wrapper(eh) {
      return function(e) {
        mode[eh](state, e);
      };
    }

    return {
      start: function() {
        state = mode.onSetup(startOpts); // this should set ui buttons
        this.on('drag', () => true, wrapper('onDrag'));
        this.on('click', () => true, wrapper('onClick'));
        this.on('mousemove', () => true, wrapper('onMouseMove'));
        this.on('mousedown', () => true, wrapper('onMouseDown'));
        this.on('mouseup', () => true, wrapper('onMouseUp'));
        this.on('mouseout', () => true, wrapper('onMouseOut'));
        this.on('keyup', () => true, wrapper('onKeyUp'));
        this.on('keydown', () => true, wrapper('onKeyDown'));
        this.on('touchstart', () => true, wrapper('onTouchStart'));
        this.on('touchmove', () => true, wrapper('onTouchMove'));
        this.on('touchend', () => true, wrapper('onTouchEnd'));
        this.on('tap', () => true, wrapper('onTap'));
      },
      stop: function() {
        mode.onStop(state);
      },
      trash: function() {
        mode.onTrash(state);
      },
      combineFeatures: function() {
        mode.onCombineFeatures(state);
      },
      uncombineFeatures: function() {
        mode.onUncombineFeatures(state);
      },
      render: function(geojson, push) {
        mode.toDisplayFeatures(state, geojson, push);
      }
    };
  };
};
