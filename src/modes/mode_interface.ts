import ModeInterfaceAcessors from './mode_interface_accessors.js';
import type { DrawCustomMode } from '../types/types';

class ModeInterface extends ModeInterfaceAcessors {
  // Triggered while a mode is being transitioned into.
  onSetup = function () {};

  // Triggered when a drag event is detected on the map
  onDrag = function () {};

  // Triggered when the mouse is clicked
  onClick = function () {};

  // Triggered with the mouse is moved
  onMouseMove = function () {};

  // Triggered when the mouse button is pressed down
  onMouseDown = function () {};

  // Triggered when the mouse button is released
  onMouseUp = function () {};

  // Triggered when the mouse leaves the map's container
  onMouseOut = function () {};

  // Triggered when a key up event is detected
  onKeyUp = function () {};

  // Triggered when a key down event is detected
  onKeyDown = function () {};

  // Triggered when a touch event is started
  onTouchStart = function () {};

  // Triggered when one drags thier finger on a mobile device
  onTouchMove = function () {};

  // Triggered when one removes their finger from the map
  onTouchEnd = function () {};

  // Triggered when one quicly taps the map
  onTap = function () {};

  // Triggered when the mode is being exited, to be used for cleaning up artifacts such as invalid features
  onStop = function () {};

  // Triggered when [draw.trash()](https://github.com/mapbox/mapbox-gl-draw/blob/main/API.md#trash-draw) is called.
  onTrash = function () {};

  // Triggered when [draw.combineFeatures()](https://github.com/mapbox/mapbox-gl-draw/blob/main/API.md#combinefeatures-draw) is called.
  onCombineFeature = function () {};

  // Triggered when [draw.uncombineFeatures()](https://github.com/mapbox/mapbox-gl-draw/blob/main/API.md#uncombinefeatures-draw) is called.
  onUncombineFeature = function () {};

  // Triggered per feature on render to convert raw features into set of features for display on the map
  // See [styling draw](https://github.com/mapbox/mapbox-gl-draw/blob/main/API.md#styling-draw) for information about what geojson properties Draw uses as part of rendering.
  toDisplayFeatures = function () {
    throw new Error('You must overwrite toDisplayFeatures');
  };

}

export default ModeInterface as unknown as DrawCustomMode;
