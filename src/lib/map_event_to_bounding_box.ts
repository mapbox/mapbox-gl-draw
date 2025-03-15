import type { Position } from 'geojson';
import type { MapMouseEvent, MapTouchEvent } from '../types/types';

function mapEventToBoundingBox(
  mapEvent: MapMouseEvent | MapTouchEvent,
  buffer: number = 0
): Position[] {
  return [
    [mapEvent.point.x - buffer, mapEvent.point.y - buffer],
    [mapEvent.point.x + buffer, mapEvent.point.y + buffer]
  ];
}

export default mapEventToBoundingBox;
