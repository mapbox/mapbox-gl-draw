const Point = require('point-geometry');

/**
 * Returns a Point representing a mouse event's position
 * relative to a containing element.
 *
 * @param {MouseEvent} mouseEvent
 * @param {Node} container
 * @returns {Point}
 */
function mouseEventPoint(mouseEvent, container) {
  const rect = container.getBoundingClientRect();
  return new Point(
    mouseEvent.clientX - rect.left - container.clientLeft,
    mouseEvent.clientY - rect.top - container.clientTop
  );
}

module.exports = mouseEventPoint;
