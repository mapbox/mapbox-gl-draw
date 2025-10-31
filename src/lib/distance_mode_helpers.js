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
