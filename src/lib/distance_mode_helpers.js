import * as turf from '@turf/turf';

/**
 * Find the nearest line segment to a given point from an array of coordinates
 * Returns the segment {start, end} and the distance in meters
 */
export function findNearestSegment(coords, snapPoint) {
  let nearestSegment = null;
  let minDistance = Infinity;

  for (let i = 0; i < coords.length - 1; i++) {
    const segmentStart = coords[i];
    const segmentEnd = coords[i + 1];
    const segment = turf.lineString([segmentStart, segmentEnd]);
    const nearestPoint = turf.nearestPointOnLine(segment, snapPoint);
    const distance = turf.distance(snapPoint, nearestPoint, { units: 'meters' });

    if (distance < minDistance) {
      minDistance = distance;
      nearestSegment = { start: segmentStart, end: segmentEnd };
    }
  }

  return nearestSegment ? { segment: nearestSegment, distance: minDistance } : null;
}

/**
 * When clicking on a point that sits on a line, detect the underlying line's bearing
 * Used by distance drawing modes to enable orthogonal snapping to lines under points
 */
export function getUnderlyingLineBearing(ctx, map, e, snappedCoord) {
  const snapping = ctx.snapping;
  if (!snapping || !snapping.snappedGeometry || snapping.snappedGeometry.type !== 'Point') {
    return null;
  }

  // Query all features at click point across all snap buffer layers
  const bufferLayers = snapping.bufferLayers.map(layerId => '_snap_buffer_' + layerId);
  const allFeaturesAtPoint = map.queryRenderedFeatures(e.point, {
    layers: bufferLayers
  });

  // Look for a line or polygon feature
  const underlyingFeature = allFeaturesAtPoint.find((feature) => {
    if (feature.id === snapping.snappedFeature.id && feature.layer.id === snapping.snappedFeature.layer.id) {
      return false;
    }
    const geomType = feature.geometry.type;
    return geomType === 'LineString' ||
           geomType === 'MultiLineString' ||
           geomType === 'Polygon' ||
           geomType === 'MultiPolygon';
  });

  if (!underlyingFeature) {
    return null;
  }

  let underlyingGeom = underlyingFeature.geometry;
  if (underlyingGeom.type === 'Polygon' || underlyingGeom.type === 'MultiPolygon') {
    underlyingGeom = turf.polygonToLine(underlyingGeom).geometry;
  }

  if (underlyingGeom.type !== 'LineString' && underlyingGeom.type !== 'MultiLineString') {
    return null;
  }

  const snapPoint = turf.point([snappedCoord.lng, snappedCoord.lat]);
  const coords = underlyingGeom.type === 'LineString' ? underlyingGeom.coordinates : underlyingGeom.coordinates.flat();

  const result = findNearestSegment(coords, snapPoint);
  if (!result) {
    return null;
  }

  const bearing = turf.bearing(
    turf.point(result.segment.start),
    turf.point(result.segment.end)
  );

  return {
    bearing: bearing,
    segment: result.segment
  };
}

/**
 * Get the bearing of a snapped line at a given coordinate
 * Returns the bearing and segment of the nearest line segment
 */
export function getSnappedLineBearing(ctx, snappedCoord) {
  const snapping = ctx.snapping;
  if (!snapping || !snapping.snappedGeometry) {
    return null;
  }

  const geom = snapping.snappedGeometry;

  // Only process LineString or MultiLineString
  if (geom.type !== 'LineString' && geom.type !== 'MultiLineString') {
    return null;
  }

  const snapPoint = turf.point([snappedCoord.lng, snappedCoord.lat]);
  const coords = geom.type === 'LineString' ? geom.coordinates : geom.coordinates.flat();

  const result = findNearestSegment(coords, snapPoint);
  if (!result) {
    return null;
  }

  const bearing = turf.bearing(
    turf.point(result.segment.start),
    turf.point(result.segment.end)
  );
  return { bearing, segment: result.segment };
}

/**
 * Calculate where a circle (centered at centerPoint with radius in meters)
 * intersects with a line segment
 * Returns the intersection point closest to mousePosition, or null if no intersection exists
 */
export function calculateCircleLineIntersection(centerPoint, radiusMeters, lineSegment, mousePosition) {
  const center = turf.point(centerPoint);
  const lineStart = turf.point(lineSegment.start);
  const lineEnd = turf.point(lineSegment.end);

  // Extend the line segment in both directions to ensure we catch all intersections
  const lineBearing = turf.bearing(lineStart, lineEnd);
  const extendedLineStart = turf.destination(lineStart, 0.1, lineBearing + 180, { units: 'kilometers' }).geometry.coordinates;
  const extendedLineEnd = turf.destination(lineEnd, 0.1, lineBearing, { units: 'kilometers' }).geometry.coordinates;

  // Create a circle polygon approximation
  const circle = turf.circle(centerPoint, radiusMeters / 1000, { steps: 64, units: 'kilometers' });
  const extendedLine = turf.lineString([extendedLineStart, extendedLineEnd]);

  try {
    // Find intersection points between circle and line
    const intersections = turf.lineIntersect(circle, extendedLine);

    if (intersections.features.length === 0) {
      return null;
    }

    // If only one intersection, return it
    if (intersections.features.length === 1) {
      const coord = intersections.features[0].geometry.coordinates;
      const distance = turf.distance(center, turf.point(coord), { units: 'meters' });
      return { coord, distance };
    }

    // Multiple intersections: choose the one closest to mouse position
    const mousePoint = turf.point(mousePosition);
    let closestIntersection = null;
    let minDistanceToMouse = Infinity;

    for (const intersection of intersections.features) {
      const coord = intersection.geometry.coordinates;
      const distanceToMouse = turf.distance(mousePoint, turf.point(coord), { units: 'meters' });

      if (distanceToMouse < minDistanceToMouse) {
        minDistanceToMouse = distanceToMouse;
        closestIntersection = coord;
      }
    }

    if (closestIntersection) {
      const distance = turf.distance(center, turf.point(closestIntersection), { units: 'meters' });
      return { coord: closestIntersection, distance };
    }
  } catch (e) {
    return null;
  }

  return null;
}

/**
 * Calculate where the bearing line from startPoint intersects with lineSegment (extended to infinity)
 * Returns null if lines are parallel or intersection distance is unreasonable
 */
export function calculateLineIntersection(startPoint, bearing, lineSegment) {
  const p1 = turf.point(startPoint);
  const lineStart = turf.point(lineSegment.start);
  const lineEnd = turf.point(lineSegment.end);
  const lineBearing = turf.bearing(lineStart, lineEnd);

  // Check if lines are nearly parallel (within 5 degrees)
  let angleDiff = Math.abs(bearing - lineBearing);
  if (angleDiff > 180) angleDiff = Math.abs(360 - angleDiff);
  if (angleDiff < 5 || angleDiff > 175) {
    return null; // Lines are too parallel
  }

  // Create a long line along the bearing (extended bidirectionally)
  // Using 100m (0.1km) extension which is sufficient for small geometries
  const bearingLine = turf.lineString([
    turf.destination(p1, 0.1, bearing + 180, { units: 'kilometers' }).geometry.coordinates,
    turf.destination(p1, 0.1, bearing, { units: 'kilometers' }).geometry.coordinates
  ]);

  // Create extended line along the snap line bearing
  const extendedSnapLine = turf.lineString([
    turf.destination(lineStart, 0.1, lineBearing + 180, { units: 'kilometers' }).geometry.coordinates,
    turf.destination(lineStart, 0.1, lineBearing, { units: 'kilometers' }).geometry.coordinates
  ]);

  try {
    const intersection = turf.lineIntersect(bearingLine, extendedSnapLine);

    if (intersection.features.length > 0) {
      const intersectionPoint = intersection.features[0].geometry.coordinates;
      const distance = turf.distance(p1, turf.point(intersectionPoint), { units: 'meters' });

      // Only return if distance is reasonable (less than 10km)
      if (distance < 10000) {
        return {
          coord: intersectionPoint,
          distance: distance
        };
      }
    }
  } catch (e) {
    return null;
  }

  return null;
}

/**
 * When extended guidelines are active and we're snapping to a line,
 * check if the cursor is close to an intersection between the extended guidelines and the snapped line.
 * If yes, return a point snap at that intersection to prioritize it.
 * Returns null if no close intersection found.
 */
export function findExtendedGuidelineIntersection(extendedGuidelines, snapInfo, cursorPosition, snapTolerance) {
  if (!extendedGuidelines || extendedGuidelines.length === 0) {
    return null;
  }

  if (!snapInfo || snapInfo.type !== 'line') {
    return null;
  }

  const cursorPoint = turf.point([cursorPosition.lng, cursorPosition.lat]);
  const lineSegment = snapInfo.segment;
  const lineStart = turf.point(lineSegment.start);
  const lineEnd = turf.point(lineSegment.end);
  const lineBearing = turf.bearing(lineStart, lineEnd);

  // Create extended line from the snap line
  const extendedSnapLine = turf.lineString([
    turf.destination(lineStart, 0.1, lineBearing + 180, { units: 'kilometers' }).geometry.coordinates,
    turf.destination(lineStart, 0.1, lineBearing, { units: 'kilometers' }).geometry.coordinates
  ]);

  let closestIntersection = null;
  let minDistance = Infinity;

  // Check each extended guideline for intersections
  for (const guideline of extendedGuidelines) {
    try {
      const guidelineLineString = turf.lineString(guideline.geometry.coordinates);
      const intersections = turf.lineIntersect(guidelineLineString, extendedSnapLine);

      for (const intersection of intersections.features) {
        const intersectionCoord = intersection.geometry.coordinates;
        const intersectionPoint = turf.point(intersectionCoord);

        // Check distance from cursor to intersection
        const distanceToCursor = turf.distance(cursorPoint, intersectionPoint, { units: 'meters' });

        if (distanceToCursor < minDistance) {
          minDistance = distanceToCursor;
          closestIntersection = intersectionCoord;
        }
      }
    } catch (e) {
      // Ignore errors and continue
      continue;
    }
  }

  // If we found an intersection within snap tolerance, return it as a point snap
  if (closestIntersection && minDistance <= snapTolerance) {
    return {
      type: 'point',
      coord: closestIntersection,
      snappedFeature: snapInfo.snappedFeature
    };
  }

  return null;
}

/**
 * Find the closest snap lines that intersect the orthogonal line from the midpoint
 * of the line being drawn. Returns the closest line on each side (max 2 lines).
 * @param {Object} ctx - The context object with options
 * @param {Object} map - The Mapbox map instance
 * @param {Array} lastVertex - The last vertex coordinate [lng, lat]
 * @param {Object} currentPosition - Current mouse position {lng, lat}
 */
export function findNearbyParallelLines(ctx, map, lastVertex, currentPosition) {
  const snapping = ctx.snapping;
  if (!snapping || !snapping.bufferLayers || snapping.bufferLayers.length === 0) {
    return [];
  }

  // Calculate midpoint of the line being drawn
  const midpoint = turf.midpoint(
    turf.point(lastVertex),
    turf.point([currentPosition.lng, currentPosition.lat])
  );

  // Calculate bearing of the line being drawn
  const lineBearing = turf.bearing(
    turf.point(lastVertex),
    turf.point([currentPosition.lng, currentPosition.lat])
  );

  // Create orthogonal line (perpendicular to the line being drawn)
  // Extend it using the configured search distance in both directions from the midpoint
  const searchDistance = ctx.options.parallelSnapSearchDistance || 1;
  const orthogonalBearing = lineBearing + 90;
  const orthogonalStart = turf.destination(
    midpoint,
    searchDistance,
    orthogonalBearing + 180,
    { units: 'kilometers' }
  );
  const orthogonalEnd = turf.destination(
    midpoint,
    searchDistance,
    orthogonalBearing,
    { units: 'kilometers' }
  );

  const orthogonalLine = turf.lineString([
    orthogonalStart.geometry.coordinates,
    orthogonalEnd.geometry.coordinates
  ]);

  // Query all snap features (use large buffer box to get everything nearby)
  const bufferLayers = snapping.bufferLayers.map(layerId => '_snap_buffer_' + layerId);
  const allFeatures = map.queryRenderedFeatures({
    layers: bufferLayers
  });

  const intersectingLines = [];

  for (const feature of allFeatures) {
    let geom = feature.geometry;

    // Skip points
    if (geom.type === 'Point') {
      continue;
    }

    // Convert polygons to lines
    if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      geom = turf.polygonToLine(geom).geometry;
    }

    // Only process LineString
    if (geom.type === 'LineString') {
      const coords = geom.coordinates;
      if (coords.length >= 2) {
        const snapLine = turf.lineString(coords);

        // Check if this line intersects our orthogonal line
        try {
          const intersections = turf.lineIntersect(snapLine, orthogonalLine);

          if (intersections.features.length > 0) {
            // Calculate bearing of the snap line
            const bearing = turf.bearing(
              turf.point(coords[0]),
              turf.point(coords[coords.length - 1])
            );

            // Calculate distance from midpoint to intersection
            const intersectionPoint = intersections.features[0].geometry.coordinates;
            const distanceFromMidpoint = turf.distance(
              midpoint,
              turf.point(intersectionPoint),
              { units: 'meters' }
            );

            // Determine which side of the midpoint the intersection is on
            const intersectionBearing = turf.bearing(
              midpoint,
              turf.point(intersectionPoint)
            );

            // Normalize bearings
            const normOrthogonal = ((orthogonalBearing % 360) + 360) % 360;
            const normIntersection = ((intersectionBearing % 360) + 360) % 360;

            // Determine side: if intersection bearing is close to orthogonal bearing, it's "right side"
            // otherwise it's "left side"
            let diff = Math.abs(normOrthogonal - normIntersection);
            if (diff > 180) diff = 360 - diff;
            const side = diff < 90 ? 'right' : 'left';

            intersectingLines.push({
              feature: feature,
              bearing: bearing,
              segment: { start: coords[0], end: coords[coords.length - 1] },
              geometry: geom,
              distanceFromMidpoint: distanceFromMidpoint,
              side: side
            });
          }
        } catch (e) {
          // Ignore intersection errors
          continue;
        }
      }
    }
  }

  // Find the single closest line (regardless of side)
  if (intersectingLines.length === 0) {
    return [];
  }

  intersectingLines.sort((a, b) => a.distanceFromMidpoint - b.distanceFromMidpoint);

  return [intersectingLines[0]];
}

/**
 * Find the best matching parallel line bearing within tolerance
 * Returns null if no match, or {bearing, matchedLine} if found
 * @param {Array} nearbyLines - Array of nearby parallel line candidates
 * @param {number} mouseBearing - Current mouse bearing in degrees
 * @param {number} tolerance - Tolerance in degrees for matching (from ctx.options.parallelSnapTolerance)
 */
export function getParallelBearing(nearbyLines, mouseBearing, tolerance) {
  if (!nearbyLines || nearbyLines.length === 0) {
    return null;
  }

  let bestMatch = null;
  let bestDiff = Infinity;

  const normalizedMouse = ((mouseBearing % 360) + 360) % 360;

  for (const line of nearbyLines) {
    const lineBearing = line.bearing;
    const normalizedLine = ((lineBearing % 360) + 360) % 360;

    // Check both directions of the line (bearing and bearing + 180)
    for (const testBearing of [normalizedLine, (normalizedLine + 180) % 360]) {
      let diff = Math.abs(testBearing - normalizedMouse);
      if (diff > 180) diff = 360 - diff;

      if (diff <= tolerance && diff < bestDiff) {
        bestDiff = diff;
        // Use the actual bearing that matched (either lineBearing or lineBearing + 180)
        const matchedBearing = testBearing === normalizedLine ? lineBearing : lineBearing + 180;
        bestMatch = {
          bearing: matchedBearing,
          matchedLine: line,
          diff: diff
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Resolves conflicts between orthogonal, parallel, and bothSnapsActive snapping
 * Returns which snap should win based on proximity and bearing comparison
 *
 * @param {Object} options
 * @param {Object|null} options.orthogonalMatch - Orthogonal snap match object with bearing
 * @param {Object|null} options.parallelLineMatch - Parallel line snap match object with diff property
 * @param {boolean} options.bothSnapsActive - Whether double orthogonal snap is active
 * @param {Array} options.lastVertex - Last vertex coordinate [lng, lat]
 * @param {Object} options.lngLat - Current mouse position {lng, lat}
 * @param {Object|null} options.closingPerpendicularSnap - Closing perpendicular snap object (for bothSnapsActive calculation)
 * @param {number} options.proximityThreshold - Distance threshold in meters for bothSnapsActive priority
 * @param {number} options.mouseBearing - Current mouse bearing in degrees
 *
 * @returns {Object} { orthogonalMatch, parallelLineMatch } - One will be null based on conflict resolution
 */
export function resolveSnapConflicts(options) {
  let { orthogonalMatch, parallelLineMatch, bothSnapsActive, lastVertex, lngLat, closingPerpendicularSnap, proximityThreshold, mouseBearing } = options;

  // Smart conflict resolution with geo-based priority for bothSnapsActive
  if (bothSnapsActive && parallelLineMatch) {
    // Calculate the bothSnapsActive intersection point
    const perpLine = {
      start: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing + 180,
        { units: "kilometers" }
      ).geometry.coordinates,
      end: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing,
        { units: "kilometers" }
      ).geometry.coordinates,
    };

    const intersection = calculateLineIntersection(
      lastVertex,
      orthogonalMatch.bearing,
      perpLine
    );

    if (intersection) {
      // Calculate distance from mouse to intersection point
      const distanceToIntersection = turf.distance(
        turf.point([lngLat.lng, lngLat.lat]),
        turf.point(intersection.coord),
        { units: 'meters' }
      );

      // If very close to intersection (within configured threshold), prioritize bothSnapsActive
      if (distanceToIntersection < proximityThreshold) {
        parallelLineMatch = null;
      } else {
        // Far from intersection, allow bearing comparison
        const orthogonalDiff = (() => {
          const normOrtho = ((orthogonalMatch.bearing % 360) + 360) % 360;
          const normMouse = ((mouseBearing % 360) + 360) % 360;
          let diff = Math.abs(normOrtho - normMouse);
          if (diff > 180) diff = 360 - diff;
          return diff;
        })();

        const parallelDiff = parallelLineMatch.diff;

        // If parallel is closer to mouse bearing, disable orthogonal snaps
        if (parallelDiff < orthogonalDiff) {
          orthogonalMatch = null;
          // This will also disable bothSnapsActive since orthogonalMatch becomes null
        } else {
          parallelLineMatch = null;
        }
      }
    }
  } else if (orthogonalMatch && parallelLineMatch) {
    // No bothSnapsActive - simple bearing comparison
    const orthogonalDiff = (() => {
      const normOrtho = ((orthogonalMatch.bearing % 360) + 360) % 360;
      const normMouse = ((mouseBearing % 360) + 360) % 360;
      let diff = Math.abs(normOrtho - normMouse);
      if (diff > 180) diff = 360 - diff;
      return diff;
    })();

    const parallelDiff = parallelLineMatch.diff;

    if (parallelDiff < orthogonalDiff) {
      orthogonalMatch = null;
    } else {
      parallelLineMatch = null;
    }
  }

  return { orthogonalMatch, parallelLineMatch };
}

/**
 * Check if clicking near an extended guideline intersection point.
 * This handles the logic for detecting when the cursor is near an intersection
 * between an extended guideline and another line feature.
 * Returns the intersection coordinate if found, or null otherwise.
 */
export function checkExtendedGuidelineIntersectionClick(ctx, map, state, e, getSnapInfoFn) {
  if (!state.extendedGuidelines || state.extendedGuidelines.length === 0) {
    return null;
  }

  const snapping = ctx.snapping;
  if (!snapping || !snapping.snappedFeature) {
    return null;
  }

  const isExtendedGuideline =
    snapping.snappedFeature.properties &&
    snapping.snappedFeature.properties.isExtendedGuideline;

  if (isExtendedGuideline) {
    // Snapping to extended guideline - check for intersections with other lines
    const snapInfo = getSnapInfoFn(e.lngLat);

    // Query all features at cursor point to find other lines
    const bufferLayers = snapping.bufferLayers.map(layerId => '_snap_buffer_' + layerId);
    const allFeaturesAtPoint = map.queryRenderedFeatures(e.point, {
      layers: bufferLayers
    });

    // Look for a non-extended-guideline line feature
    const otherLineFeature = allFeaturesAtPoint.find((feature) => {
      if (feature.properties && feature.properties.isExtendedGuideline) {
        return false;
      }
      const geomType = feature.geometry.type;
      return geomType === 'LineString' ||
             geomType === 'MultiLineString' ||
             geomType === 'Polygon' ||
             geomType === 'MultiPolygon';
    });

    if (otherLineFeature && snapInfo) {
      // Get the geometry of the other line
      let otherGeom = otherLineFeature.geometry;
      if (otherGeom.type === 'Polygon' || otherGeom.type === 'MultiPolygon') {
        otherGeom = turf.polygonToLine(otherGeom).geometry;
      }

      if (otherGeom.type === 'LineString' || otherGeom.type === 'MultiLineString') {
        const snapPoint = turf.point([e.lngLat.lng, e.lngLat.lat]);
        const coords = otherGeom.type === 'LineString' ? otherGeom.coordinates : otherGeom.coordinates.flat();

        const result = findNearestSegment(coords, snapPoint);
        if (result) {
          const otherLineSnapInfo = {
            type: 'line',
            coord: snapInfo.coord,
            bearing: turf.bearing(
              turf.point(result.segment.start),
              turf.point(result.segment.end)
            ),
            segment: result.segment,
            snappedFeature: otherLineFeature
          };

          const intersectionSnap = findExtendedGuidelineIntersection(
            state.extendedGuidelines,
            otherLineSnapInfo,
            e.lngLat,
            state.snapTolerance
          );

          if (intersectionSnap) {
            return intersectionSnap.coord;
          }
        }
      }
    }
  } else {
    // Snapping to something else - check if it's a line that intersects with extended guideline
    const tempSnapInfo = getSnapInfoFn(e.lngLat);
    if (tempSnapInfo && tempSnapInfo.type === 'line') {
      const intersectionSnap = findExtendedGuidelineIntersection(
        state.extendedGuidelines,
        tempSnapInfo,
        e.lngLat,
        state.snapTolerance
      );
      if (intersectionSnap) {
        return intersectionSnap.coord;
      }
    }
  }

  return null;
}
