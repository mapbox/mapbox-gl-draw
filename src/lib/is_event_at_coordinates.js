function isEventAtCoordinates(event, coordinates) {
  if (!event.latLng) return false;
  return event.latLng[1] === coordinates[0] && event.latLng[0] === coordinates[1];
}

module.exports = isEventAtCoordinates;
