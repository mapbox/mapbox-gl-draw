import ModeInterfaceAcessors from './mode_interface_accessors.js';
import type { DrawCustomMode, StrictFeature } from '../types/types';

class ModeInterface extends ModeInterfaceAcessors implements DrawCustomMode {
  // Triggered while a mode is being transitioned into.
  onSetup: (opts: any) => any = (opts) => {};

  // Event Handlers
  onDrag: (state: any, event: any) => void = (state, event) => {};
  onClick: (state: any, event: any) => void = (state, event) => {};
  onMouseMove: (state: any, event: any) => void = (state, event) => {};
  onMouseDown: (state: any, event: any) => void = (state, event) => {};
  onMouseUp: (state: any, event: any) => void = (state, event) => {};
  onMouseOut: (state: any, event: any) => void = (state, event) => {};
  onKeyUp: (state: any, event: any) => void = (state, event) => {};
  onKeyDown: (state: any, event: any) => void = (state, event) => {};
  onTouchStart: (state: any, event: any) => void = (state, event) => {};
  onTouchMove: (state: any, event: any) => void = (state, event) => {};
  onTouchEnd: (state: any, event: any) => void = (state, event) => {};
  onTap: (state: any, event: any) => void = (state, event) => {};

  // Lifecycle Events
  onStop: (state: any) => void = (state) => {};
  onTrash: (state: any) => void = (state) => {};
  onCombineFeatures: (state: any) => void = (state) => {};
  onUncombineFeatures: (state: any) => void = (state) => {};

  // Converts raw features into display features
  toDisplayFeatures: (state: any, geojson: StrictFeature, push: (feature: StrictFeature) => void) => void = 
    (state, geojson, push) => {
      throw new Error('You must overwrite toDisplayFeatures');
    };
}

export default ModeInterface;

