import * as turf from '@turf/turf';

/**
 * Rail Constraint System
 * Constrains feature movement to a "rail" - either perpendicular or parallel to a grabbed edge
 * Direction is determined by mouse movement relative to grab point
 */

const SOURCE_ID = 'rail-constraint';
const LINE_LAYER_ID = 'rail-constraint-line';

/**
 * Find which edge of a feature was clicked
 * @param {Object} feature - The feature that was clicked
 * @param {Object} clickPoint - The click position {lng, lat}
 * @param {number} threshold - Distance threshold in meters (default: 10m)
 * @returns {Object|null} Edge info {start: [lng, lat], end: [lng, lat], bearing} or null
 */
export function findClickedEdge(feature, clickPoint, threshold = 10) {
  if (!feature || !clickPoint) return null;

  const geom = feature.toGeoJSON().geometry;
  const clickPt = turf.point([clickPoint.lng, clickPoint.lat]);

  let coordinates = [];

  // Extract coordinates based on geometry type
  if (geom.type === 'LineString') {
    coordinates = geom.coordinates;
  } else if (geom.type === 'Polygon') {
    coordinates = geom.coordinates[0]; // Outer ring
  } else if (geom.type === 'MultiLineString' || geom.type === 'MultiPolygon') {
    // For multi-geometries, find the closest part
    // Simplified: just use the first part
    if (geom.type === 'MultiLineString') {
      coordinates = geom.coordinates[0];
    } else {
      coordinates = geom.coordinates[0][0]; // First polygon, outer ring
    }
  }

  if (coordinates.length < 2) return null;

  // Find the closest edge to the click point
  let closestEdge = null;
  let minDistance = Infinity;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    const edgeLine = turf.lineString([start, end]);
    const nearestPoint = turf.nearestPointOnLine(edgeLine, clickPt);
    const distance = turf.distance(clickPt, nearestPoint, { units: 'meters' });

    if (distance < minDistance && distance < threshold) {
      minDistance = distance;
      const bearing = turf.bearing(turf.point(start), turf.point(end));
      closestEdge = {
        start,
        end,
        bearing,
        index: i
      };
    }
  }

  return closestEdge;
}

/**
 * Determine rail direction based on mouse movement
 * Returns one of 4 directions if within tolerance, null if too far from any rail
 * @param {Object} grabPoint - Original grab position {lng, lat}
 * @param {Object} currentPoint - Current mouse position {lng, lat}
 * @param {number} edgeBearing - Bearing of the grabbed edge in degrees
 * @param {number} tolerance - Angular tolerance in degrees (default: 15)
 * @returns {Object|null} {direction: string, bearing: number, deviation: number} or null
 */
export function determineRailDirection(grabPoint, currentPoint, edgeBearing, tolerance = 15) {
  if (!grabPoint || !currentPoint) return null;

  // Calculate bearing from grab point to current mouse position
  const mouseBearing = turf.bearing(
    turf.point([grabPoint.lng, grabPoint.lat]),
    turf.point([currentPoint.lng, currentPoint.lat])
  );

  // Normalize bearings to 0-360
  const normalizedEdge = ((edgeBearing % 360) + 360) % 360;
  const normalizedMouse = ((mouseBearing % 360) + 360) % 360;

  // Calculate perpendicular bearings (90° from edge)
  const perpForward = (normalizedEdge + 90) % 360;
  const perpBack = (normalizedEdge - 90 + 360) % 360;

  // Parallel bearings are the edge bearing and opposite
  const paraForward = normalizedEdge;
  const paraBack = (normalizedEdge + 180) % 360;

  // Calculate angular differences to each of the 4 directions
  const directions = [
    { name: 'perpendicular-forward', bearing: perpForward },
    { name: 'perpendicular-back', bearing: perpBack },
    { name: 'parallel-forward', bearing: paraForward },
    { name: 'parallel-back', bearing: paraBack }
  ];

  // Find the direction closest to mouse bearing
  let closestDirection = null;
  let minDiff = Infinity;

  for (const dir of directions) {
    const diff = angularDifference(normalizedMouse, dir.bearing);
    if (diff < minDiff) {
      minDiff = diff;
      closestDirection = { ...dir, deviation: diff };
    }
  }

  // Only return if within tolerance
  if (minDiff <= tolerance) {
    return closestDirection;
  }

  return null; // Too far from any rail - allow free movement
}

/**
 * Calculate the smallest angular difference between two bearings
 */
function angularDifference(bearing1, bearing2) {
  let diff = Math.abs(bearing1 - bearing2);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Constrain a point to move only along a rail (bearing line from origin)
 * @param {Object} origin - Rail origin point {lng, lat}
 * @param {Object} targetPoint - Desired target position {lng, lat}
 * @param {number} railBearing - Bearing of the rail in degrees
 * @returns {Object} Constrained position {lng, lat}
 */
export function constrainToRail(origin, targetPoint, railBearing) {
  if (!origin || !targetPoint) return targetPoint;

  const originPt = turf.point([origin.lng, origin.lat]);
  const targetPt = turf.point([targetPoint.lng, targetPoint.lat]);

  // Calculate distance from origin to target
  const distance = turf.distance(originPt, targetPt, { units: 'meters' });

  // Calculate bearing from origin to target
  const targetBearing = turf.bearing(originPt, targetPt);

  // Project target onto rail by finding distance along rail bearing
  // Use dot product concept: distance * cos(angle between bearings)
  const angleDiff = angularDifference(targetBearing, railBearing);
  const angleRad = angleDiff * Math.PI / 180;
  const projectedDistance = distance * Math.cos(angleRad);

  // Calculate constrained point along rail
  const constrainedPoint = turf.destination(
    originPt,
    projectedDistance / 1000, // Convert meters to kilometers
    railBearing,
    { units: 'kilometers' }
  );

  return {
    lng: constrainedPoint.geometry.coordinates[0],
    lat: constrainedPoint.geometry.coordinates[1]
  };
}

/**
 * Show the rail line for visual feedback
 * @param {Object} map - Mapbox GL map instance
 * @param {Object} origin - Rail origin point {lng, lat}
 * @param {number} bearing - Rail bearing in degrees
 * @param {number} length - Length of rail line to display in meters (default: 1000m)
 */
export function showRailLine(map, origin, bearing, length = 1000) {
  if (!map || !origin) return;

  const originPt = turf.point([origin.lng, origin.lat]);

  // Create rail line extending in both directions
  const forward = turf.destination(originPt, length / 1000, bearing, { units: 'kilometers' });
  const backward = turf.destination(originPt, length / 1000, bearing + 180, { units: 'kilometers' });

  const railLine = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        backward.geometry.coordinates,
        forward.geometry.coordinates
      ]
    }
  };

  const featureCollection = {
    type: 'FeatureCollection',
    features: [railLine]
  };

  // Create or update source
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: featureCollection
    });

    // Add rail line layer (subtle dashed line)
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': '#0066ff',
        'line-width': 2,
        'line-opacity': 0.6,
        'line-dasharray': [4, 4]
      }
    });
  } else {
    map.getSource(SOURCE_ID).setData(featureCollection);
  }
}

/**
 * Remove the rail line visualization
 * @param {Object} map - Mapbox GL map instance
 */
export function removeRailLine(map) {
  if (!map) return;

  if (map.getLayer && map.getLayer(LINE_LAYER_ID)) {
    map.removeLayer(LINE_LAYER_ID);
  }
  if (map.getSource && map.getSource(SOURCE_ID)) {
    map.removeSource(SOURCE_ID);
  }
}

/**
 * Show L-shaped orthogonal indicator at the grab point
 * @param {Object} map - Mapbox GL map instance
 * @param {Object} cornerVertex - The grab point {lng, lat}
 * @param {number} referenceBearing - Bearing of the grabbed edge
 * @param {number} nextBearing - Bearing of the rail direction (perpendicular or parallel)
 */
export function showRailIndicator(map, cornerVertex, referenceBearing, nextBearing) {
  if (!map || !cornerVertex) return;

  const cornerPoint = turf.point([cornerVertex.lng, cornerVertex.lat]);

  // Point 1: 2m back along reference segment (opposite direction)
  const point1 = turf.destination(
    cornerPoint,
    2 / 1000,
    referenceBearing + 180,
    { units: 'kilometers' }
  );

  // Point 2: The diagonal corner of the square - from point1, go 2m perpendicular (along next segment direction)
  const point2 = turf.destination(
    turf.point(point1.geometry.coordinates),
    2 / 1000,
    nextBearing,
    { units: 'kilometers' }
  );

  // Point 3: 2m forward along next segment
  const point3 = turf.destination(
    cornerPoint,
    2 / 1000,
    nextBearing,
    { units: 'kilometers' }
  );

  const indicatorFeature = {
    type: 'Feature',
    properties: { isRailIndicator: true },
    geometry: {
      type: 'LineString',
      coordinates: [
        point1.geometry.coordinates,
        point2.geometry.coordinates,
        point3.geometry.coordinates
      ]
    }
  };

  if (!map.getSource('rail-angle-indicator')) {
    map.addSource('rail-angle-indicator', {
      type: 'geojson',
      data: indicatorFeature
    });
    map.addLayer({
      id: 'rail-angle-indicator',
      type: 'line',
      source: 'rail-angle-indicator',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 1.0
      }
    });
  } else {
    map.getSource('rail-angle-indicator').setData(indicatorFeature);
  }
}

/**
 * Remove the rail indicator visualization
 * @param {Object} map - Mapbox GL map instance
 */
export function removeRailIndicator(map) {
  if (!map) return;

  if (map.getLayer && map.getLayer('rail-angle-indicator')) {
    map.removeLayer('rail-angle-indicator');
  }
  if (map.getSource && map.getSource('rail-angle-indicator')) {
    map.removeSource('rail-angle-indicator');
  }
}
