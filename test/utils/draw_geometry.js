import click from './mouse_click';

/**
 * Draws a feature on a map.
 */

const mapFeaturesToModes = {
  Polygon: 'draw_polygon',
  Point: 'draw_point',
  LineString: 'draw_line_string'
};

export default function drawGeometry(map, draw, type, coordinates) {
  draw.changeMode(mapFeaturesToModes[type]);
  let drawCoordinates;
  if (type === 'Polygon') drawCoordinates = coordinates[0];
  if (type === 'Point') drawCoordinates = [coordinates];
  if (type === 'LineString') drawCoordinates = coordinates;
  drawCoordinates.forEach(point => {
    click(map, {
      lngLat: {
        lng: point[0],
        lat: point[1]
      },
      point: { x: 0, y: 0 }
    });
  });
  draw.changeMode('simple_select');
}
