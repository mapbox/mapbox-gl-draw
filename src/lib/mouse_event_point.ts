import Point from '@mapbox/point-geometry';
import type { PointLike } from 'mapbox-gl';

export const mouseEventPoint = (
  mouseEvent: MouseEvent,
  container: HTMLElement
): PointLike => {
  const rect = container.getBoundingClientRect();
  return new Point(
    mouseEvent.clientX - rect.left - (container.clientLeft || 0),
    mouseEvent.clientY - rect.top - (container.clientTop || 0)
  );
}
