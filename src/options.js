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
   * Position of the angle/distance input container using rem units [left, top]
   * Supports any valid CSS positioning values.
   * @type {[string, string]}
   * @default ['50%', 'calc(100% - 3rem)'] (bottom-center)
   * @example
   * ['50%', 'calc(100% - 3rem)']  - bottom-center (default)
   * ['1rem', '1rem']              - top-left with 1rem padding
   * ['calc(100% - 20rem)', '1rem'] - top-right with padding
   * ['50%', '50%']                - center of map
   * ['2rem', 'calc(100% - 5rem)'] - lower-left area
   */
  angleDistanceInputPosition: ['50%', 'calc(100% - 3rem)'],

  /**
   * Callback function to validate vertices before they are added.
   * Receives the proposed coordinates array and returns boolean.
   * @type {function|null}
   * @default null
   * @param {Array<Array<number>>} proposedCoords - Array of [lng, lat] coordinates
   * @returns {boolean} - true to allow vertex, false to reject
   */
  validateVertex: null,
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
