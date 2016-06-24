module.exports = {
  CONTROL_BUTTON_CLASS: 'mapbox-gl-draw_ctrl-draw-btn',
  CONTROL_BUTTON_LINE_CLASS: 'mapbox-gl-draw_line',
  CONTROL_BUTTON_POLYGON_CLASS: 'mapbox-gl-draw_polygon',
  CONTROL_BUTTON_POINT_CLASS: 'mapbox-gl-draw_point',
  CONTROL_BUTTON_TRASH_CLASS: 'mapbox-gl-draw_trash',
  CONTROL_GROUP_CLASS: 'mapboxgl-ctrl-group',
  MOUSE_ADD_CLASS_FRAGMENT: 'add',
  MOUSE_MOVE_CLASS_FRAGMENT: 'move',
  ATTRIBUTION_CLASS: 'mapboxgl-ctrl-attrib',
  ACTIVE_BUTTON_CLASS: 'active',
  types: {
    POLYGON: 'polygon',
    LINE: 'line_string',
    POINT: 'point'
  },
  modes: {
    DRAW_LINE: 'draw_line_string',
    DRAW_POLYGON: 'draw_polygon',
    DRAW_POINT: 'draw_point',
    SIMPLE_SELECT: 'simple_select',
    DIRECT_SELECT: 'direct_select'
  },
  events: {
    CREATE: 'draw.create',
    DELETE: 'draw.delete',
    UPDATE: 'draw.update',
    SELECTION_CHANGE: 'draw.selectionchange',
    MODE_CHANGE: 'draw.modechange',
    RENDER: 'draw.render'
  },
  updateTypes: {
    MOVE: 'move',
    CHANGE_COORDINATES: 'change_coordinates'
  }
};
