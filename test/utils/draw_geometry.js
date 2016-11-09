import click from './mouse_click';
import setupAfterNextRender from './after_next_render';
import makeMouseEvent from './make_mouse_event';

/**
 * Draws a feature on a map.
 */

const mapFeaturesToModes = {
  Polygon: 'draw_polygon',
  Point: 'draw_point',
  LineString: 'draw_line_string'
};

export default function drawGeometry(map, draw, type, coordinates, cb) {
  const afterNextRender = setupAfterNextRender(map);
  draw.changeMode(mapFeaturesToModes[type]);
  let drawCoordinates;
  if (type === 'Polygon') drawCoordinates = coordinates[0];
  if (type === 'Point') drawCoordinates = [coordinates];
  if (type === 'LineString') drawCoordinates = coordinates;

  const addCoordinate = function(idx) {
    const point = drawCoordinates[idx];
    if (point === undefined) {
      return cb();
    }
    click(map, makeMouseEvent(point[0], point[1], false));
    afterNextRender(() => {
      addCoordinate(idx + 1);
    });
  };

  addCoordinate(0);
}
