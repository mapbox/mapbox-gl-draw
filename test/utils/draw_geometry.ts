import click from './mouse_click';
import { setupAfterNextRender } from './after_next_render';
import makeMouseEvent from './make_mouse_event';

const mapFeaturesToModes = {
  Polygon: 'draw_polygon',
  Point: 'draw_point',
  LineString: 'draw_line_string'
};

export async function drawGeometry(map, draw, type, coordinates) {
  const afterNextRender = setupAfterNextRender(map);
  draw.changeMode(mapFeaturesToModes[type]);

  let drawCoordinates;
  if (type === 'Polygon') drawCoordinates = coordinates[0];
  if (type === 'Point') drawCoordinates = [coordinates];
  if (type === 'LineString') drawCoordinates = coordinates;

  for (const point of drawCoordinates) {
    click(map, makeMouseEvent(point[0], point[1], false));
    await afterNextRender(map);
  }
}
