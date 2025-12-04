import * as turf from '@turf/turf';

/**
 * Shared visual indicator functions for snapping
 * Used by both drawing modes and direct_select editing mode
 */

/**
 * Show a right-angle indicator (L-shaped) at a corner vertex
 * @param {Object} map - Mapbox GL map instance
 * @param {Array} cornerVertex - Corner vertex coordinate [lng, lat]
 * @param {number} referenceBearing - Bearing of the reference segment
 * @param {number} nextBearing - Bearing of the next segment
 * @param {boolean} flipInside - Whether to flip the indicator inside (default: false)
 */
export function showRightAngleIndicator(map, cornerVertex, referenceBearing, nextBearing, flipInside = false) {
  if (!map) return;

  const cornerPoint = turf.point(cornerVertex);

  // For regular orthogonal snap: indicator on outside (back along reference, forward along next)
  // For closing perpendicular: indicator on inside (forward along reference, back along next)
  const refOffset = flipInside ? 0 : 180;
  const nextOffset = flipInside ? 180 : 0;

  // Point 1: along reference segment
  const point1 = turf.destination(
    cornerPoint,
    2 / 1000,
    referenceBearing + refOffset,
    { units: 'kilometers' }
  );

  // Point 2: The diagonal corner of the square
  const point2 = turf.destination(
    turf.point(point1.geometry.coordinates),
    2 / 1000,
    nextBearing + nextOffset,
    { units: 'kilometers' }
  );

  // Point 3: along next segment
  const point3 = turf.destination(
    cornerPoint,
    2 / 1000,
    nextBearing + nextOffset,
    { units: 'kilometers' }
  );

  const indicatorFeature = {
    type: 'Feature',
    properties: { isRightAngleIndicator: true },
    geometry: {
      type: 'LineString',
      coordinates: [
        point1.geometry.coordinates,
        point2.geometry.coordinates,
        point3.geometry.coordinates
      ]
    }
  };

  if (!map.getSource('right-angle-indicator')) {
    map.addSource('right-angle-indicator', {
      type: 'geojson',
      data: indicatorFeature
    });

    map.addLayer({
      id: 'right-angle-indicator',
      type: 'line',
      source: 'right-angle-indicator',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 1.0
      }
    });
  } else {
    map.getSource('right-angle-indicator').setData(indicatorFeature);
  }
}

/**
 * Remove the right-angle indicator from the map
 * @param {Object} map - Mapbox GL map instance
 */
export function removeRightAngleIndicator(map) {
  if (!map) return;

  if (map.getLayer && map.getLayer('right-angle-indicator')) {
    map.removeLayer('right-angle-indicator');
  }
  if (map.getSource && map.getSource('right-angle-indicator')) {
    map.removeSource('right-angle-indicator');
  }
}

/**
 * Show a collinear snap line (dashed line extending from vertex)
 * @param {Object} map - Mapbox GL map instance
 * @param {Array} vertex - Vertex coordinate [lng, lat]
 * @param {number} bearing - Bearing of the collinear direction
 */
export function showCollinearSnapLine(map, vertex, bearing) {
  if (!map) return;

  const vertexPoint = turf.point(vertex);
  const extensionDistance = 0.2; // 200 meters in kilometers

  const extendedBackward = turf.destination(
    vertexPoint,
    extensionDistance,
    bearing + 180,
    { units: 'kilometers' }
  );
  const extendedForward = turf.destination(
    vertexPoint,
    extensionDistance,
    bearing,
    { units: 'kilometers' }
  );

  const extendedLineFeature = {
    type: 'Feature',
    properties: { isCollinearLine: true },
    geometry: {
      type: 'LineString',
      coordinates: [
        extendedBackward.geometry.coordinates,
        extendedForward.geometry.coordinates
      ]
    }
  };

  const featureCollection = {
    type: 'FeatureCollection',
    features: [extendedLineFeature]
  };

  if (!map.getSource('collinear-snap-line')) {
    map.addSource('collinear-snap-line', {
      type: 'geojson',
      data: featureCollection
    });

    map.addLayer({
      id: 'collinear-snap-line',
      type: 'line',
      source: 'collinear-snap-line',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 0.3,
        'line-dasharray': [4, 4]
      }
    });
  } else {
    map.getSource('collinear-snap-line').setData(featureCollection);
  }
}

/**
 * Remove the collinear snap line from the map
 * @param {Object} map - Mapbox GL map instance
 */
export function removeCollinearSnapLine(map) {
  if (!map) return;

  if (map.getLayer && map.getLayer('collinear-snap-line')) {
    map.removeLayer('collinear-snap-line');
  }
  if (map.getSource && map.getSource('collinear-snap-line')) {
    map.removeSource('collinear-snap-line');
  }
}

/**
 * Show a parallel line indicator (dashed line showing parallel direction)
 * @param {Object} map - Mapbox GL map instance
 * @param {Array} startVertex - Start vertex coordinate [lng, lat]
 * @param {number} bearing - Bearing of the parallel direction
 */
export function showParallelLineIndicator(map, startVertex, bearing) {
  if (!map) return;

  const startPoint = turf.point(startVertex);
  const extensionDistance = 0.2; // 200 meters in kilometers

  const extendedPoint = turf.destination(
    startPoint,
    extensionDistance,
    bearing,
    { units: 'kilometers' }
  );

  const lineFeature = {
    type: 'Feature',
    properties: { isParallelIndicator: true },
    geometry: {
      type: 'LineString',
      coordinates: [
        startVertex,
        extendedPoint.geometry.coordinates
      ]
    }
  };

  if (!map.getSource('parallel-line-indicator')) {
    map.addSource('parallel-line-indicator', {
      type: 'geojson',
      data: lineFeature
    });

    map.addLayer({
      id: 'parallel-line-indicator',
      type: 'line',
      source: 'parallel-line-indicator',
      paint: {
        'line-color': '#0066ff',
        'line-width': 1,
        'line-opacity': 0.5,
        'line-dasharray': [4, 4]
      }
    });
  } else {
    map.getSource('parallel-line-indicator').setData(lineFeature);
  }
}

/**
 * Remove the parallel line indicator from the map
 * @param {Object} map - Mapbox GL map instance
 */
export function removeParallelLineIndicator(map) {
  if (!map) return;

  if (map.getLayer && map.getLayer('parallel-line-indicator')) {
    map.removeLayer('parallel-line-indicator');
  }
  if (map.getSource && map.getSource('parallel-line-indicator')) {
    map.removeSource('parallel-line-indicator');
  }
}

/**
 * Remove all snap indicators from the map
 * @param {Object} map - Mapbox GL map instance
 */
export function removeAllSnapIndicators(map) {
  removeRightAngleIndicator(map);
  removeCollinearSnapLine(map);
  removeParallelLineIndicator(map);
}
