import * as Constants from "./constants.js";

import styles from "./lib/theme.js";
import modes from "./modes/index.js";

const defaultOptions = {
  defaultMode: Constants.modes.SIMPLE_SELECT,
  keybindings: true,
  touchEnabled: true,
  clickBuffer: 2,
  touchBuffer: 25,
  boxSelect: true,
  displayControlsDefault: true,
  styles,
  modes,
  controls: {},
  userProperties: false,
  snapLayers: [],
  snapFeatureFilter: undefined,
  snapDistance: 20,
  snapping: {
    layers: [],
  },

  // Distance mode snapping configuration options
  /** @type {number} Tolerance in degrees for orthogonal snapping (perpendicular/parallel angles) */
  orthogonalSnapTolerance: 5,

  /** @type {number} Tolerance in degrees for parallel line snapping */
  parallelSnapTolerance: 3,

  /** @type {number} Distance threshold in meters for bothSnapsActive conflict resolution priority */
  parallelSnapProximityThreshold: 5,

  /** @type {number} Search distance in kilometers for finding parallel lines (orthogonal line extension) */
  parallelSnapSearchDistance: 1,

  /** @type {number} Extension distance in kilometers for extended guidelines (when hovering intersection points) */
  extendedGuidelineDistance: 0.2,

  // Angle/Distance Input UI Configuration
  /** @type {boolean} Enable/disable the angle and distance input UI in distance drawing modes (default: true) */
  useAngleDistanceInput: true,

  /**
   * Position of the angle/distance input container in normalized coordinates [x, y]
   * where [0, 0] is top-left corner and [1, 1] is bottom-right corner.
   * The coordinates represent the center point of the input container.
   * @type {[number, number]}
   * @default [0.5, 0.9] (bottom-center, matching current behavior)
   * @example
   * [0.5, 0.9]   - bottom-center (default)
   * [0, 0]       - top-left corner
   * [1, 1]       - bottom-right corner
   * [0.5, 0.5]   - center of map
   * [0.2, 0.8]   - lower-left area
   */
  angleDistanceInputPosition: [0.5, 0.93],
};

const showControls = {
  point: true,
  line_string: true,
  polygon: true,
  trash: true,
  combine_features: true,
  uncombine_features: true,
};

const hideControls = {
  point: false,
  line_string: false,
  polygon: false,
  trash: false,
  combine_features: false,
  uncombine_features: false,
};

function addSources(styles, sourceBucket) {
  return styles.map((style) => {
    if (style.source) return style;
    return Object.assign({}, style, {
      id: `${style.id}.${sourceBucket}`,
      source:
        sourceBucket === "hot" ? Constants.sources.HOT : Constants.sources.COLD,
    });
  });
}

export default function (options = {}) {
  let withDefaults = Object.assign({}, options);

  if (!options.controls) {
    withDefaults.controls = {};
  }

  if (options.displayControlsDefault === false) {
    withDefaults.controls = Object.assign({}, hideControls, options.controls);
  } else {
    withDefaults.controls = Object.assign({}, showControls, options.controls);
  }

  withDefaults = Object.assign({}, defaultOptions, withDefaults);

  // Layers with a shared source should be adjacent for performance reasons
  withDefaults.styles = addSources(withDefaults.styles, "cold").concat(
    addSources(withDefaults.styles, "hot")
  );

  return withDefaults;
}
