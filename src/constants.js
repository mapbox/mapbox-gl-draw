export const classes = {
  CONTROL_BASE: 'maplibregl-ctrl',
  CONTROL_PREFIX: 'maplibregl-ctrl-',
  CONTROL_BUTTON: 'maplibre-gl-draw_ctrl-draw-btn',
  CONTROL_BUTTON_LINE: 'maplibre-gl-draw_line',
  CONTROL_BUTTON_POLYGON: 'maplibre-gl-draw_polygon',
  CONTROL_BUTTON_POINT: 'maplibre-gl-draw_point',
  CONTROL_BUTTON_TRASH: 'maplibre-gl-draw_trash',
  CONTROL_BUTTON_COMBINE_FEATURES: 'maplibre-gl-draw_combine',
  CONTROL_BUTTON_UNCOMBINE_FEATURES: 'maplibre-gl-draw_uncombine',
  CONTROL_GROUP: 'maplibregl-ctrl-group',
  ATTRIBUTION: 'maplibregl-ctrl-attrib',
  ACTIVE_BUTTON: 'active',
  BOX_SELECT: 'maplibre-gl-draw_boxselect'
};

export const sources = {
  HOT: 'maplibre-gl-draw-hot',
  COLD: 'maplibre-gl-draw-cold'
};

export const cursors = {
  ADD: 'add',
  MOVE: 'move',
  DRAG: 'drag',
  POINTER: 'pointer',
  NONE: 'none'
};

export const types = {
  POLYGON: 'polygon',
  LINE: 'line_string',
  POINT: 'point'
};

export const geojsonTypes = {
  FEATURE: 'Feature',
  POLYGON: 'Polygon',
  LINE_STRING: 'LineString',
  POINT: 'Point',
  FEATURE_COLLECTION: 'FeatureCollection',
  MULTI_PREFIX: 'Multi',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon'
};

export const modes = {
  DRAW_LINE_STRING: 'draw_line_string',
  DRAW_POLYGON: 'draw_polygon',
  DRAW_POINT: 'draw_point',
  SIMPLE_SELECT: 'simple_select',
  DIRECT_SELECT: 'direct_select',
  STATIC: 'static'
};

export const events = {
  CREATE: 'draw.create',
  DELETE: 'draw.delete',
  UPDATE: 'draw.update',
  SELECTION_CHANGE: 'draw.selectionchange',
  MODE_CHANGE: 'draw.modechange',
  ACTIONABLE: 'draw.actionable',
  RENDER: 'draw.render',
  COMBINE_FEATURES: 'draw.combine',
  UNCOMBINE_FEATURES: 'draw.uncombine'
};

export const updateActions = {
  MOVE: 'move',
  CHANGE_COORDINATES: 'change_coordinates'
};

export const meta = {
  FEATURE: 'feature',
  MIDPOINT: 'midpoint',
  VERTEX: 'vertex'
};

export const activeStates = {
  ACTIVE: 'true',
  INACTIVE: 'false'
};

export const interactions = [
  'scrollZoom',
  'boxZoom',
  'dragRotate',
  'dragPan',
  'keyboard',
  'doubleClickZoom',
  'touchZoomRotate'
];

export const LAT_MIN = -90;
export const LAT_RENDERED_MIN = -85;
export const LAT_MAX = 90;
export const LAT_RENDERED_MAX = 85;
export const LNG_MIN = -270;
export const LNG_MAX = 270;
