import * as turf from '@turf/turf';

/**
 * Movement Vector Visualization
 * Shows a dashed line from the original grab point to the current drag position
 * with a distance label, similar to extended guidelines in distance modes
 */

const SOURCE_ID = 'movement-vector';
const LINE_LAYER_ID = 'movement-vector-line';
const LABEL_LAYER_ID = 'movement-vector-label';
const DEFAULT_MIN_DISTANCE_METERS = 1; // Minimum distance before showing visualization

/**
 * Calculate geographic distance between two points in meters
 */
function calculateDistance(fromLngLat, toLngLat) {
  const from = turf.point([fromLngLat.lng, fromLngLat.lat]);
  const to = turf.point([toLngLat.lng, toLngLat.lat]);
  return turf.distance(from, to, { units: 'meters' });
}

/**
 * Format distance for display
 * @param {number} distanceMeters - Distance in meters
 * @returns {string} Formatted distance string (e.g., "125.4m")
 */
function formatDistance(distanceMeters) {
  return `${distanceMeters.toFixed(1)}m`;
}

/**
 * Calculate rotation angle for label to align with line
 * Prevents upside-down text
 */
function calculateRotation(fromLngLat, toLngLat) {
  const bearing = turf.bearing(
    turf.point([fromLngLat.lng, fromLngLat.lat]),
    turf.point([toLngLat.lng, toLngLat.lat])
  );

  // Convert bearing to rotation
  let rotation = bearing - 90;
  rotation = ((rotation % 360) + 360) % 360;

  // Flip if upside down
  if (rotation > 90 && rotation < 270) {
    rotation = (rotation + 180) % 360;
  }

  return rotation;
}

/**
 * Show or update the movement vector visualization
 * @param {Object} map - Mapbox GL map instance
 * @param {Object} fromLngLat - Starting position {lng, lat}
 * @param {Object} toLngLat - Current position {lng, lat}
 * @param {Object} options - Optional configuration
 * @param {number} options.minDistance - Minimum distance threshold in meters (default: 1)
 * @returns {boolean} True if visualization was shown, false if below threshold
 */
export function showMovementVector(map, fromLngLat, toLngLat, options = {}) {
  if (!map || !fromLngLat || !toLngLat) return false;

  const minDistance = options.minDistance || DEFAULT_MIN_DISTANCE_METERS;
  const distance = calculateDistance(fromLngLat, toLngLat);

  // Don't show if below threshold
  if (distance < minDistance) {
    removeMovementVector(map);
    return false;
  }

  // Create line feature
  const lineFeature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [fromLngLat.lng, fromLngLat.lat],
        [toLngLat.lng, toLngLat.lat]
      ]
    }
  };

  // Calculate midpoint for label
  const midpoint = turf.midpoint(
    turf.point([fromLngLat.lng, fromLngLat.lat]),
    turf.point([toLngLat.lng, toLngLat.lat])
  );

  // Calculate bearing of the line
  const bearing = turf.bearing(
    turf.point([fromLngLat.lng, fromLngLat.lat]),
    turf.point([toLngLat.lng, toLngLat.lat])
  );

  // Offset the label 3 meters perpendicular to the line (to the left side)
  const offsetDistance = 3 / 1000; // 3 meters in kilometers
  const perpendicularBearing = bearing - 90; // 90 degrees left
  const offsetMidpoint = turf.destination(
    midpoint,
    offsetDistance,
    perpendicularBearing,
    { units: 'kilometers' }
  );

  // Create label feature
  const labelFeature = {
    type: 'Feature',
    properties: {
      distance: formatDistance(distance),
      rotation: calculateRotation(fromLngLat, toLngLat)
    },
    geometry: {
      type: 'Point',
      coordinates: offsetMidpoint.geometry.coordinates
    }
  };

  const featureCollection = {
    type: 'FeatureCollection',
    features: [lineFeature, labelFeature]
  };

  // Create or update source
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: featureCollection
    });

    // Add line layer (matching extended guidelines style)
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 0.3,
        'line-dasharray': [4, 4]
      }
    });

    // Add label layer
    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      layout: {
        'text-field': ['get', 'distance'],
        'text-size': 10,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 0],
        'text-anchor': 'center',
        'text-rotate': ['get', 'rotation'],
        'text-rotation-alignment': 'map',
        'text-pitch-alignment': 'map',
        'text-allow-overlap': true,
        'text-ignore-placement': true
      },
      paint: {
        'text-color': '#000000',
        'text-opacity': 1
      }
    });
  } else {
    // Update existing source
    map.getSource(SOURCE_ID).setData(featureCollection);
  }

  return true;
}

/**
 * Remove the movement vector visualization
 * @param {Object} map - Mapbox GL map instance
 */
export function removeMovementVector(map) {
  if (!map) return;

  // Remove layers
  if (map.getLayer && map.getLayer(LABEL_LAYER_ID)) {
    map.removeLayer(LABEL_LAYER_ID);
  }
  if (map.getLayer && map.getLayer(LINE_LAYER_ID)) {
    map.removeLayer(LINE_LAYER_ID);
  }

  // Remove source
  if (map.getSource && map.getSource(SOURCE_ID)) {
    map.removeSource(SOURCE_ID);
  }
}

/**
 * Check if movement exceeds threshold without showing visualization
 * @param {Object} fromLngLat - Starting position {lng, lat}
 * @param {Object} toLngLat - Current position {lng, lat}
 * @param {number} minDistance - Minimum distance threshold in meters
 * @returns {boolean} True if distance exceeds threshold
 */
export function exceedsThreshold(fromLngLat, toLngLat, minDistance = DEFAULT_MIN_DISTANCE_METERS) {
  if (!fromLngLat || !toLngLat) return false;
  const distance = calculateDistance(fromLngLat, toLngLat);
  return distance >= minDistance;
}
