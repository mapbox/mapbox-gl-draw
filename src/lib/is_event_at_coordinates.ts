export const isEventAtCoordinates = (
  event: { lngLat: { lng: number; lat: number } },
  coordinates: [number, number],
  tolerance = 1e-6 // Default precision tolerance
): boolean => {
  return (
    Math.abs(event.lngLat.lng - coordinates[0]) < tolerance &&
    Math.abs(event.lngLat.lat - coordinates[1]) < tolerance
  );
}
