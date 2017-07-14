const ModeInterface = module.exports = require('./mode_interface_accessors');

ModeInterface.prototype.setup = function() {};

ModeInterface.prototype.onDrag = function() {};

ModeInterface.prototype.onClick = function() {};

ModeInterface.prototype.onMouseMove = function() {};

ModeInterface.prototype.onMouseDown = function() {};

ModeInterface.prototype.onMouseUp = function() {};

ModeInterface.prototype.onMouseOut = function() {};

ModeInterface.prototype.onKeyUp = function() {};

ModeInterface.prototype.onKeyDown = function() {};

ModeInterface.prototype.onTouchStart = function() {};

ModeInterface.prototype.onTouchMove = function() {};

ModeInterface.prototype.onTouchEnd = function() {};

ModeInterface.prototype.onTap = function() {};

ModeInterface.prototype.onStop = function() {};

ModeInterface.prototype.onTrash = function() {};

ModeInterface.prototype.onCombineFeature = function() {};

ModeInterface.prototype.onUncombineFeature = function() {};

ModeInterface.prototype.toDisplayFeatures = function() {
  throw new Error('You must overwrite toDisplayFeatures');
};

