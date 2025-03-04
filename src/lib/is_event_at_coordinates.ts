export const isEventAtCoordinates = (event: {
  lngLat: {
    lng: number,
    lat: number
  }
}, coordinates: [number, number]) => {
  if (!event.lngLat) return false;
  return (
    event.lngLat.lng === coordinates[0] && event.lngLat.lat === coordinates[1]
  );
}
