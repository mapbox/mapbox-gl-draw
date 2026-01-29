import * as turf from "@turf/turf";
import * as CommonSelectors from "../lib/common_selectors.js";
import doubleClickZoom from "../lib/double_click_zoom.js";
import * as Constants from "../constants.js";
import {
  findNearestSegment,
  getUnderlyingLineBearing,
  getSnappedLineBearing,
  getAdjacentSegmentsAtVertex,
  calculateCircleLineIntersection,
  calculateLineIntersection,
  findExtendedGuidelineIntersection,
  findAllGuidelineIntersections,
  checkExtendedGuidelineIntersectionClick,
  findNearbyParallelLines,
  getParallelBearing,
  resolveSnapConflicts,
  snapToNearbyVertex,
  calculatePerpendicularToLine,
  getExtendedGuidelineBearings,
  getPerpendicularToGuidelineBearing,
  clearPointCache,
  calculatePixelDistanceToExtendedGuidelines,
} from "../lib/distance_mode_helpers.js";
import {
  createDistanceInput as createDistanceInputUI,
  createAngleInput as createAngleInputUI,
  createSnappingIndicator as createSnappingIndicatorUI,
  showDistanceAngleUI,
  hideDistanceAngleUI,
  removeDistanceAngleUI,
} from "../lib/angle_distance_input.js";
import {
  DRAWING_SUB_MODES,
  createDrawingModeSelector,
  hideDrawingModeSelector,
  showDrawingModeSelector,
  removeDrawingModeSelector,
} from "../lib/drawing_mode_selector.js";

// Reusable unit options to avoid repeated object allocation
const TURF_UNITS_KM = { units: "kilometers" };
const TURF_UNITS_M = { units: "meters" };

// Throttle state for onMouseMove heavy operations
let lastHeavyComputeTime = 0;
const HEAVY_COMPUTE_THROTTLE_MS = 16; // ~60fps max for heavy operations

const DrawPolygonDistance = {};

DrawPolygonDistance.onSetup = function (opts) {
  opts = opts || {};

  const polygon = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POLYGON,
      coordinates: [[]],
    },
  });

  this.addFeature(polygon);
  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.POLYGON);
  this.setActionableState({
    trash: true,
  });

  const state = {
    polygon,
    currentVertexPosition: 0,
    currentDistance: null,
    distanceInput: null,
    currentAngle: null,
    angleInput: null,
    vertices: [],
    guideCircle: null,
    currentPosition: null,
    lastPoint: null,
    inputEnabled: true,
    snapEnabled: true,
    snapPoints: [],
    snapTolerance: 20,
    snappedLineBearing: null,
    snappedLineSegment: null,
    adjacentSegments: null, // Array of {bearing, segment} for corner points
    labelDebounceTimer: null,
    // Extended guideline hover state
    hoverDebounceTimer: null,
    hoveredIntersectionPoint: null,
    extendedGuidelines: null,
    lastHoverPosition: null,
    isHoveringExtendedGuidelines: false,
    isInExtendedGuidelinePersistenceZone: false, // true when within 5x snap distance of guideline
    isActivelySnappingToGuideline: false, // true when actually snapping to the guideline
    // Parallel line snapping state
    parallelLineSnap: null,
    // Line sub-mode state
    linePhase: 'drawing', // 'drawing' or 'offset'
    lineOffsetWidth: null,
    lineOffsetSide: null, // 'left' or 'right' based on mouse position
  };

  createDrawingModeSelector(this._ctx, state);
  this.createDistanceInput(state);
  this.createAngleInput(state);
  this.createSnappingIndicator(state);

  // Hide distance/angle UI initially - it shows when drawing starts
  hideDistanceAngleUI(state);

  return state;
};

DrawPolygonDistance.createDistanceInput = function (state) {
  const self = this;
  createDistanceInputUI(this._ctx, state, {
    shouldActivateKeyHandler: () => state.vertices.length > 0,
    onEnter: () => {
      if (state.drawingSubMode === DRAWING_SUB_MODES.LINE) {
        if (state.linePhase === 'offset') return;
        if (state.vertices.length >= 2) {
          self.enterLineOffsetPhase(state);
        }
      } else if (state.vertices.length >= 3) {
        self.finishDrawing(state);
      }
    },
    onBackspace: () => self.onTrash(state),
    initiallyHidden: false
  });
};

DrawPolygonDistance.createAngleInput = function (state) {
  const self = this;
  createAngleInputUI(this._ctx, state, {
    shouldActivateKeyHandler: () => state.vertices.length > 0,
    onEnter: () => {
      if (state.drawingSubMode === DRAWING_SUB_MODES.LINE) {
        if (state.linePhase === 'offset') return;
        if (state.vertices.length >= 2) {
          self.enterLineOffsetPhase(state);
        }
      } else if (state.vertices.length >= 3) {
        self.finishDrawing(state);
      }
    },
    onBackspace: () => self.onTrash(state)
  });
};

DrawPolygonDistance.createSnappingIndicator = function (state) {
  createSnappingIndicatorUI(this._ctx, state);
};

DrawPolygonDistance.getSnapInfo = function (lngLat) {
  const snapping = this._ctx.snapping;
  if (!snapping || !snapping.snappedGeometry) {
    return null;
  }

  const geom = snapping.snappedGeometry;
  const snapCoord = this._ctx.snapping.snapCoord(lngLat);

  // Check if actually snapped
  const didSnap = snapCoord.lng !== lngLat.lng || snapCoord.lat !== lngLat.lat;
  if (!didSnap) {
    return null;
  }

  // Point snap
  if (geom.type === "Point") {
    return {
      type: "point",
      coord: [snapCoord.lng, snapCoord.lat],
      snappedFeature: snapping.snappedFeature,
    };
  }

  // Line snap (LineString or MultiLineString)
  if (geom.type === "LineString" || geom.type === "MultiLineString") {
    const snapPoint = turf.point([snapCoord.lng, snapCoord.lat]);
    const coords =
      geom.type === "LineString" ? geom.coordinates : geom.coordinates.flat();

    const result = findNearestSegment(coords, snapPoint);
    if (result) {
      const bearing = turf.bearing(
        turf.point(result.segment.start),
        turf.point(result.segment.end),
      );
      return {
        type: "line",
        coord: [snapCoord.lng, snapCoord.lat],
        bearing: bearing,
        segment: result.segment,
        snappedFeature: snapping.snappedFeature,
      };
    }
  }

  return null;
};

DrawPolygonDistance.getOrthogonalBearing = function (
  state,
  currentBearing,
  tolerance = 5,
) {
  if (!state.snapEnabled) {
    return null;
  }

  // Cache key based on state that affects orthogonal bearings
  // Use 1-degree precision instead of tolerance-based quantization to avoid geometric drift
  const adjacentSegmentsKey = state.adjacentSegments ? state.adjacentSegments.length : 0;
  const cacheKey = `${state.vertices.length}-${state.snappedLineBearing}-${adjacentSegmentsKey}-${Math.round(
    currentBearing,
  )}`;

  if (
    state.orthogonalBearingCache &&
    state.orthogonalBearingCache.key === cacheKey
  ) {
    return state.orthogonalBearingCache.result;
  }

  const orthogonalAngles = [0, 90, 180, 270];
  let bestMatch = null;
  let bestDiff = Infinity;

  // Check previous segment bearing (if we have 2+ vertices)
  if (state.vertices.length >= 2) {
    const lastVertex = state.vertices[state.vertices.length - 1];
    const secondLastVertex = state.vertices[state.vertices.length - 2];
    const from = turf.point(secondLastVertex);
    const to = turf.point(lastVertex);
    const lastSegmentBearing = turf.bearing(from, to);

    for (const angle of orthogonalAngles) {
      const orthogonalBearing = lastSegmentBearing + angle;
      const normalizedOrthogonal = ((orthogonalBearing % 360) + 360) % 360;
      const normalizedCurrent = ((currentBearing % 360) + 360) % 360;

      let diff = Math.abs(normalizedOrthogonal - normalizedCurrent);
      if (diff > 180) diff = 360 - diff;

      if (diff <= tolerance && diff < bestDiff) {
        bestDiff = diff;
        bestMatch = {
          bearing: orthogonalBearing,
          referenceBearing: lastSegmentBearing,
          referenceType: "previous",
          referenceSegment: { start: secondLastVertex, end: lastVertex },
          angleFromReference: angle,
        };
      }
    }
  }

  // Check FIRST segment bearing (if we have 3+ vertices) - helps close rectangles!
  if (state.vertices.length >= 3) {
    const firstVertex = state.vertices[0];
    const secondVertex = state.vertices[1];
    const from = turf.point(firstVertex);
    const to = turf.point(secondVertex);
    const firstSegmentBearing = turf.bearing(from, to);

    for (const angle of orthogonalAngles) {
      const orthogonalBearing = firstSegmentBearing + angle;
      const normalizedOrthogonal = ((orthogonalBearing % 360) + 360) % 360;
      const normalizedCurrent = ((currentBearing % 360) + 360) % 360;

      let diff = Math.abs(normalizedOrthogonal - normalizedCurrent);
      if (diff > 180) diff = 360 - diff;

      if (diff <= tolerance && diff < bestDiff) {
        bestDiff = diff;
        bestMatch = {
          bearing: orthogonalBearing,
          referenceBearing: firstSegmentBearing,
          referenceType: "first",
          referenceSegment: { start: firstVertex, end: secondVertex },
          angleFromReference: angle,
        };
      }
    }
  }

  // Check snapped line bearing (if we have a snapped line)
  // This includes underlying lines from points, which are stored in state when clicking
  if (state.snappedLineBearing !== null && state.vertices.length >= 1) {
    for (const angle of orthogonalAngles) {
      const orthogonalBearing = state.snappedLineBearing + angle;
      const normalizedOrthogonal = ((orthogonalBearing % 360) + 360) % 360;
      const normalizedCurrent = ((currentBearing % 360) + 360) % 360;

      let diff = Math.abs(normalizedOrthogonal - normalizedCurrent);
      if (diff > 180) diff = 360 - diff;

      if (diff <= tolerance && diff < bestDiff) {
        bestDiff = diff;
        bestMatch = {
          bearing: orthogonalBearing,
          referenceBearing: state.snappedLineBearing,
          referenceType: "snapped",
          referenceSegment: state.snappedLineSegment,
          angleFromReference: angle,
        };
      }
    }
  }

  // Check ALL adjacent segments at corner points (enables perpendicular to both lines)
  if (state.adjacentSegments && state.adjacentSegments.length > 0 && state.vertices.length >= 1) {
    for (const adjacentSegment of state.adjacentSegments) {
      for (const angle of orthogonalAngles) {
        const orthogonalBearing = adjacentSegment.bearing + angle;
        const normalizedOrthogonal = ((orthogonalBearing % 360) + 360) % 360;
        const normalizedCurrent = ((currentBearing % 360) + 360) % 360;

        let diff = Math.abs(normalizedOrthogonal - normalizedCurrent);
        if (diff > 180) diff = 360 - diff;

        if (diff <= tolerance && diff < bestDiff) {
          bestDiff = diff;
          bestMatch = {
            bearing: orthogonalBearing,
            referenceBearing: adjacentSegment.bearing,
            referenceType: "adjacent",
            referenceSegment: adjacentSegment.segment,
            angleFromReference: angle,
          };
        }
      }
    }
  }

  // Cache the result
  state.orthogonalBearingCache = { key: cacheKey, result: bestMatch };

  return bestMatch;
};

DrawPolygonDistance.updateRightAngleIndicator = function (
  state,
  cornerVertex,
  referenceBearing,
  nextBearing,
  referenceSegment,
) {
  // Create L-shaped indicator that forms a square with the two line segments
  const cornerPoint = turf.point(cornerVertex);

  // Point 1: 2m back along reference segment (opposite direction)
  const point1 = turf.destination(
    cornerPoint,
    2 / 1000,
    referenceBearing + 180,
    { units: "kilometers" },
  );

  // Point 2: The diagonal corner of the square - from point1, go 2m perpendicular (along next segment direction)
  const point2 = turf.destination(
    turf.point(point1.geometry.coordinates),
    2 / 1000,
    nextBearing,
    { units: "kilometers" },
  );

  // Point 3: 2m forward along next segment
  const point3 = turf.destination(cornerPoint, 2 / 1000, nextBearing, {
    units: "kilometers",
  });

  const indicatorFeature = {
    type: "Feature",
    properties: { isRightAngleIndicator: true },
    geometry: {
      type: "LineString",
      coordinates: [
        point1.geometry.coordinates,
        point2.geometry.coordinates,
        point3.geometry.coordinates,
      ],
    },
  };

  const map = this.map;
  if (!map) return;

  if (!map.getSource("right-angle-indicator")) {
    map.addSource("right-angle-indicator", {
      type: "geojson",
      data: indicatorFeature,
    });
    map.addLayer({
      id: "right-angle-indicator",
      type: "line",
      source: "right-angle-indicator",
      paint: { "line-color": "#000000", "line-width": 1, "line-opacity": 1.0 },
    });
  } else {
    map.getSource("right-angle-indicator").setData(indicatorFeature);
  }
};

DrawPolygonDistance.removeRightAngleIndicator = function (state) {
  const map = this.map;
  if (!map) return;
  if (map.getLayer && map.getLayer("right-angle-indicator"))
    map.removeLayer("right-angle-indicator");
  if (map.getSource && map.getSource("right-angle-indicator"))
    map.removeSource("right-angle-indicator");
};

DrawPolygonDistance.updateClosingRightAngleIndicator = function (
  state,
  cornerVertex,
  referenceBearing,
  nextBearing,
  referenceSegment,
) {
  // Create L-shaped indicator for closing perpendicular (always inside)
  const cornerPoint = turf.point(cornerVertex);

  // For closing perpendicular: indicator on inside (forward along reference, back along next)
  const point1 = turf.destination(cornerPoint, 2 / 1000, referenceBearing, {
    units: "kilometers",
  });
  const point2 = turf.destination(
    turf.point(point1.geometry.coordinates),
    2 / 1000,
    nextBearing + 180,
    { units: "kilometers" },
  );
  const point3 = turf.destination(cornerPoint, 2 / 1000, nextBearing + 180, {
    units: "kilometers",
  });

  const indicatorFeature = {
    type: "Feature",
    properties: { isClosingRightAngleIndicator: true },
    geometry: {
      type: "LineString",
      coordinates: [
        point1.geometry.coordinates,
        point2.geometry.coordinates,
        point3.geometry.coordinates,
      ],
    },
  };

  state.closingRightAngleIndicator = indicatorFeature;

  const map = this.map;
  if (!map) return;

  if (!map.getSource("right-angle-indicator-closing")) {
    map.addSource("right-angle-indicator-closing", {
      type: "geojson",
      data: indicatorFeature,
    });

    map.addLayer({
      id: "right-angle-indicator-closing",
      type: "line",
      source: "right-angle-indicator-closing",
      paint: {
        "line-color": "#000000",
        "line-width": 1,
        "line-opacity": 1.0,
      },
    });
  } else {
    map.getSource("right-angle-indicator-closing").setData(indicatorFeature);
  }
};

DrawPolygonDistance.removeClosingRightAngleIndicator = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("right-angle-indicator-closing")) {
    map.removeLayer("right-angle-indicator-closing");
  }
  if (map.getSource && map.getSource("right-angle-indicator-closing")) {
    map.removeSource("right-angle-indicator-closing");
  }
  state.closingRightAngleIndicator = null;
};

DrawPolygonDistance.updateParallelLineIndicators = function (
  state,
  lastVertex,
  previewVertex,
  matchedLine,
) {
  const map = this.map;
  if (!map) return;

  // Get the snap line segment
  const coords = [matchedLine.segment.start, matchedLine.segment.end];

  // Calculate bearing of the snap line
  const bearing = turf.bearing(
    turf.point(coords[0]),
    turf.point(coords[coords.length - 1]),
  );

  // Extend the line 200m in both directions (same as extended guidelines)
  const extendedStart = turf.destination(
    turf.point(coords[0]),
    0.2,
    bearing + 180,
    { units: "kilometers" },
  );
  const extendedEnd = turf.destination(
    turf.point(coords[coords.length - 1]),
    0.2,
    bearing,
    { units: "kilometers" },
  );

  // Create extended line feature
  const extendedLineFeature = {
    type: "Feature",
    properties: { isParallelExtendedLine: true },
    geometry: {
      type: "LineString",
      coordinates: [
        extendedStart.geometry.coordinates,
        extendedEnd.geometry.coordinates,
      ],
    },
  };

  // Calculate the orthogonal connector line from lastVertex to closest point on extended line
  const lastVertexPoint = turf.point(lastVertex);
  const extendedLine = turf.lineString([
    extendedStart.geometry.coordinates,
    extendedEnd.geometry.coordinates,
  ]);
  const closestPoint = turf.nearestPointOnLine(extendedLine, lastVertexPoint);
  const connectorDistance = turf.distance(lastVertexPoint, closestPoint, {
    units: "meters",
  });

  // Create orthogonal connector line feature
  const connectorLineFeature = {
    type: "Feature",
    properties: { isOrthogonalConnector: true },
    geometry: {
      type: "LineString",
      coordinates: [lastVertex, closestPoint.geometry.coordinates],
    },
  };

  // Calculate midpoint for distance label
  const connectorMidpoint = turf.midpoint(lastVertexPoint, closestPoint);

  // Calculate bearing of the connector line for label rotation
  const connectorBearing = turf.bearing(lastVertexPoint, closestPoint);

  // Calculate label rotation (same logic as movement_vector.js)
  let labelRotation = connectorBearing - 90;
  labelRotation = ((labelRotation % 360) + 360) % 360;
  // Flip if upside down
  if (labelRotation > 90 && labelRotation < 270) {
    labelRotation = (labelRotation + 180) % 360;
  }

  // Offset the label 3 meters perpendicular to the connector line
  const offsetDistance = 3 / 1000; // 3 meters in kilometers
  const perpendicularBearing = connectorBearing - 90; // 90 degrees left
  const offsetMidpoint = turf.destination(
    connectorMidpoint,
    offsetDistance,
    perpendicularBearing,
    { units: "kilometers" },
  );

  // Create label feature with formatted distance
  const labelFeature = {
    type: "Feature",
    properties: {
      distance: `${connectorDistance.toFixed(1)}m`,
      rotation: labelRotation,
    },
    geometry: {
      type: "Point",
      coordinates: offsetMidpoint.geometry.coordinates,
    },
  };

  const featureCollection = {
    type: "FeatureCollection",
    features: [extendedLineFeature, connectorLineFeature, labelFeature],
  };

  // Render extended line, connector line, and label
  if (!map.getSource("parallel-line-indicators")) {
    map.addSource("parallel-line-indicators", {
      type: "geojson",
      data: featureCollection,
    });

    // Add parallel extended line layer
    map.addLayer({
      id: "parallel-line-indicators",
      type: "line",
      source: "parallel-line-indicators",
      filter: ["==", ["get", "isParallelExtendedLine"], true],
      paint: {
        "line-color": "#000000",
        "line-width": 1,
        "line-opacity": 0.3,
        "line-dasharray": [4, 4],
      },
    });

    // Add orthogonal connector line layer
    map.addLayer({
      id: "parallel-line-indicators-connector",
      type: "line",
      source: "parallel-line-indicators",
      filter: ["==", ["get", "isOrthogonalConnector"], true],
      paint: {
        "line-color": "#000000",
        "line-width": 1,
        "line-opacity": 0.3,
        "line-dasharray": [4, 4],
      },
    });

    // Add label layer
    map.addLayer({
      id: "parallel-line-indicators-label",
      type: "symbol",
      source: "parallel-line-indicators",
      filter: ["==", ["geometry-type"], "Point"],
      layout: {
        "text-field": ["get", "distance"],
        "text-size": 10,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0],
        "text-anchor": "center",
        "text-rotate": ["get", "rotation"],
        "text-rotation-alignment": "map",
        "text-pitch-alignment": "map",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#000000",
        "text-opacity": 1,
      },
    });
  } else {
    map.getSource("parallel-line-indicators").setData(featureCollection);
  }
};

DrawPolygonDistance.removeParallelLineIndicators = function (state) {
  const map = this.map;
  if (!map) return;

  // Remove all layers
  if (map.getLayer && map.getLayer("parallel-line-indicators-label")) {
    map.removeLayer("parallel-line-indicators-label");
  }
  if (map.getLayer && map.getLayer("parallel-line-indicators-connector")) {
    map.removeLayer("parallel-line-indicators-connector");
  }
  if (map.getLayer && map.getLayer("parallel-line-indicators")) {
    map.removeLayer("parallel-line-indicators");
  }

  // Remove source
  if (map.getSource && map.getSource("parallel-line-indicators")) {
    map.removeSource("parallel-line-indicators");
  }
};

DrawPolygonDistance.updateCollinearSnapLine = function (
  state,
  lastVertex,
  previewVertex,
  referenceBearing
) {
  const map = this.map;
  if (!map) return;

  // Extend the line in both directions from the last vertex
  const lastVertexPoint = turf.point(lastVertex);
  const extensionDistance = 0.2; // 200 meters in kilometers

  const extendedBackward = turf.destination(
    lastVertexPoint,
    extensionDistance,
    referenceBearing + 180,
    { units: 'kilometers' }
  );
  const extendedForward = turf.destination(
    lastVertexPoint,
    extensionDistance,
    referenceBearing,
    { units: 'kilometers' }
  );

  // Create extended line feature
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

  // Render extended line
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
};

DrawPolygonDistance.removeCollinearSnapLine = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('collinear-snap-line')) {
    map.removeLayer('collinear-snap-line');
  }
  if (map.getSource && map.getSource('collinear-snap-line')) {
    map.removeSource('collinear-snap-line');
  }
};

DrawPolygonDistance.onClick = function (state, e) {
  if (
    e.originalEvent &&
    (e.originalEvent.target === state.distanceInput ||
      e.originalEvent.target === state.angleInput)
  ) {
    return;
  }
  this.clickOnMap(state, e);
};

DrawPolygonDistance.detectHoveredIntersectionPoint = function (state, e) {
  const map = this.map;
  if (!map || !this._ctx.snapping) return null;

  // Query features at the hover point from snap buffer layers
  const bufferLayers = this._ctx.snapping.bufferLayers.map(
    (layerId) => "_snap_buffer_" + layerId,
  );
  const featuresAtPoint = map.queryRenderedFeatures(e.point, {
    layers: bufferLayers,
  });

  // Look for a midpoint feature FIRST (point with isMidpoint === true)
  // Midpoints also have type: 'snappingPoint', so check for them before intersections
  const midpoint = featuresAtPoint.find((feature) => {
    return (
      feature.properties &&
      feature.properties.type === "snappingPoint" &&
      feature.properties.isMidpoint === true &&
      feature.properties.guidelineIds
    );
  });

  if (midpoint) {
    return {
      coord: midpoint.geometry.coordinates,
      feature: midpoint,
      guidelineIds: JSON.parse(midpoint.properties.guidelineIds),
      type: "midpoint",
    };
  }

  // Look for an intersection point (snappingPoint with multiple guidelines, NOT a midpoint)
  const intersectionPoint = featuresAtPoint.find((feature) => {
    return (
      feature.properties &&
      feature.properties.type === "snappingPoint" &&
      feature.properties.guidelineIds &&
      feature.properties.isMidpoint !== true
    );
  });

  if (intersectionPoint) {
    return {
      coord: intersectionPoint.geometry.coordinates,
      guidelineIds: JSON.parse(intersectionPoint.properties.guidelineIds),
      feature: intersectionPoint,
      type: "intersection",
    };
  }

  return null;
};

DrawPolygonDistance.extendGuidelines = function (state, intersectionInfo) {
  const map = this.map;
  if (!map) return [];

  const extendedLines = [];

  // Handle midpoint type - create perpendicular guideline
  if (intersectionInfo.type === "midpoint") {
    const { coord, guidelineIds } = intersectionInfo;

    // Get the parent line from the guideline ID
    const guidelineId = guidelineIds[0]; // Midpoints have only one parent guideline
    const sourceId = intersectionInfo.feature.source;
    const source = map.getSource(sourceId);
    if (!source) return [];

    // Get all features from the source
    const allFeatures = map.querySourceFeatures(sourceId, {
      sourceLayer: intersectionInfo.feature.sourceLayer,
    });

    const guidelineFeature = allFeatures.find((f) => f.id === guidelineId);
    if (!guidelineFeature) return [];

    const geometry = guidelineFeature.geometry;
    let lineBearing;

    // Calculate the bearing of the line segment containing the midpoint
    if (geometry.type === "LineString") {
      const coords = geometry.coordinates;
      if (coords.length < 2) return [];

      // Find the segment that contains this midpoint
      let segmentBearing;
      const coordPoint = turf.point(coord); // Cache the point object
      for (let i = 0; i < coords.length - 1; i++) {
        const start = coords[i];
        const end = coords[i + 1];
        const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];

        // Use proper turf.distance for lat/lon coordinates
        const dist = turf.distance(turf.point(mid), coordPoint, {
          units: "meters",
        });
        if (dist < 1) {
          // Within 1 meter - calculate bearing and exit early
          segmentBearing = turf.bearing(turf.point(start), turf.point(end));
          break;
        }
      }

      if (segmentBearing === undefined) {
        // Fallback: use bearing from first to last point
        segmentBearing = turf.bearing(
          turf.point(coords[0]),
          turf.point(coords[coords.length - 1]),
        );
      }

      lineBearing = segmentBearing;
    } else if (geometry.type === "MultiLineString") {
      // Handle MultiLineString - find which line contains the midpoint
      let segmentBearing;
      const coordPoint = turf.point(coord); // Cache the point object
      for (const lineCoords of geometry.coordinates) {
        if (lineCoords.length < 2) continue;

        for (let i = 0; i < lineCoords.length - 1; i++) {
          const start = lineCoords[i];
          const end = lineCoords[i + 1];
          const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];

          // Use proper turf.distance for lat/lon coordinates
          const dist = turf.distance(turf.point(mid), coordPoint, {
            units: "meters",
          });
          if (dist < 1) {
            segmentBearing = turf.bearing(turf.point(start), turf.point(end));
            break;
          }
        }
        if (segmentBearing !== undefined) break;
      }

      if (segmentBearing === undefined) return [];
      lineBearing = segmentBearing;
    } else {
      return []; // Don't handle other geometry types
    }

    // Create perpendicular line (90 degrees to the original line)
    const perpendicularBearing = lineBearing + 90;
    const extensionDistance =
      this._ctx.options.extendedGuidelineDistance || 0.2;

    const extendedStart = turf.destination(
      turf.point(coord),
      extensionDistance,
      perpendicularBearing + 180,
      { units: "kilometers" },
    );
    const extendedEnd = turf.destination(
      turf.point(coord),
      extensionDistance,
      perpendicularBearing,
      { units: "kilometers" },
    );

    extendedLines.push({
      type: "Feature",
      properties: { isExtendedGuideline: true, isMidpointGuideline: true },
      geometry: {
        type: "LineString",
        coordinates: [
          extendedStart.geometry.coordinates,
          coord,
          extendedEnd.geometry.coordinates,
        ],
      },
    });

    return extendedLines;
  }

  // Handle intersection type - extend the original guidelines
  const { coord, guidelineIds } = intersectionInfo;

  // Query source features once and cache for all guidelines
  const sourceId = intersectionInfo.feature.source;
  const source = map.getSource(sourceId);
  if (!source) return [];

  const allFeatures = map.querySourceFeatures(sourceId, {
    sourceLayer: intersectionInfo.feature.sourceLayer,
  });

  // For each guideline ID, find and extend it
  for (const guidelineId of guidelineIds) {
    const guidelineFeature = allFeatures.find((f) => f.id === guidelineId);
    if (!guidelineFeature) continue;

    let geometry = guidelineFeature.geometry;

    // Handle different geometry types
    if (geometry.type === "LineString") {
      const coords = geometry.coordinates;
      if (coords.length < 2) continue;

      // Calculate bearing from first to last point
      const bearing = turf.bearing(
        turf.point(coords[0]),
        turf.point(coords[coords.length - 1]),
      );

      // Extend by configured distance in each direction
      const extensionDistance =
        this._ctx.options.extendedGuidelineDistance || 0.2;
      const extendedStart = turf.destination(
        turf.point(coords[0]),
        extensionDistance,
        bearing + 180,
        { units: "kilometers" },
      );
      const extendedEnd = turf.destination(
        turf.point(coords[coords.length - 1]),
        extensionDistance,
        bearing,
        { units: "kilometers" },
      );

      extendedLines.push({
        type: "Feature",
        properties: { isExtendedGuideline: true },
        geometry: {
          type: "LineString",
          coordinates: [
            extendedStart.geometry.coordinates,
            ...coords,
            extendedEnd.geometry.coordinates,
          ],
        },
      });
    } else if (geometry.type === "MultiLineString") {
      // Handle each line segment in the MultiLineString
      for (const lineCoords of geometry.coordinates) {
        if (lineCoords.length < 2) continue;

        const bearing = turf.bearing(
          turf.point(lineCoords[0]),
          turf.point(lineCoords[lineCoords.length - 1]),
        );

        const extensionDistance =
          this._ctx.options.extendedGuidelineDistance || 0.2;
        const extendedStart = turf.destination(
          turf.point(lineCoords[0]),
          extensionDistance,
          bearing + 180,
          { units: "kilometers" },
        );
        const extendedEnd = turf.destination(
          turf.point(lineCoords[lineCoords.length - 1]),
          extensionDistance,
          bearing,
          { units: "kilometers" },
        );

        extendedLines.push({
          type: "Feature",
          properties: { isExtendedGuideline: true },
          geometry: {
            type: "LineString",
            coordinates: [
              extendedStart.geometry.coordinates,
              ...lineCoords,
              extendedEnd.geometry.coordinates,
            ],
          },
        });
      }
    }
  }

  return extendedLines;
};

DrawPolygonDistance.renderExtendedGuidelines = function (state, extendedLines) {
  const map = this.map;
  if (!map) return;

  const featureCollection = {
    type: "FeatureCollection",
    features: extendedLines,
  };

  // Create or update the visual layer for extended guidelines
  if (!map.getSource("extended-guidelines")) {
    map.addSource("extended-guidelines", {
      type: "geojson",
      data: featureCollection,
    });

    map.addLayer({
      id: "extended-guidelines",
      type: "line",
      source: "extended-guidelines",
      paint: {
        "line-color": "#000000",
        "line-width": 1,
        "line-opacity": 0.3,
        "line-dasharray": [4, 4],
      },
    });
  } else {
    map.getSource("extended-guidelines").setData(featureCollection);
  }

  // Create or update the snap buffer layer for extended guidelines
  const bufferLayerId = "_snap_buffer_extended-guidelines";
  const snapDistance = this._ctx.options.snapDistance || 15;

  if (!map.getLayer(bufferLayerId)) {
    map.addLayer({
      id: bufferLayerId,
      type: "line",
      source: "extended-guidelines",
      paint: {
        "line-color": "hsla(0,100%,50%,0.001)",
        "line-width": snapDistance * 2,
      },
    });

    // Add mouseover handler to enable snapping
    const mouseoverHandler = (e) => {
      if (e.features && e.features.length > 0) {
        // Don't override snappingPoint snaps - they have priority over extended guidelines
        if (this._ctx.snapping.snappedFeature &&
            this._ctx.snapping.snappedFeature.properties &&
            this._ctx.snapping.snappedFeature.properties.type === 'snappingPoint') {
          // Keep the snappingPoint as the snap target, but mark that we're also hovering guidelines
          state.isHoveringExtendedGuidelines = true;
          return;
        }

        // Clear snap-hover state from previous snapped feature before switching
        if (this._ctx.snapping.snappedFeature &&
            this._ctx.snapping.snappedFeature.id !== undefined &&
            !(this._ctx.snapping.snappedFeature.properties &&
              this._ctx.snapping.snappedFeature.properties.isExtendedGuideline)) {
          this._ctx.snapping.setSnapHoverState(this._ctx.snapping.snappedFeature, false);
        }
        const feature = e.features[0];
        this._ctx.snapping.snappedGeometry = feature.geometry;
        this._ctx.snapping.snappedFeature = feature;
        // Mark that we're hovering over extended guidelines
        state.isHoveringExtendedGuidelines = true;
      }
    };

    const mouseoutHandler = () => {
      // Mark that we're no longer hovering over extended guidelines
      state.isHoveringExtendedGuidelines = false;

      // Only clear if we're still showing extended guidelines
      // The snapping system will handle switching to other features
      if (
        this._ctx.snapping.snappedGeometry &&
        this._ctx.snapping.snappedFeature &&
        this._ctx.snapping.snappedFeature.properties &&
        this._ctx.snapping.snappedFeature.properties.isExtendedGuideline
      ) {
        this._ctx.snapping.snappedGeometry = undefined;
        this._ctx.snapping.snappedFeature = undefined;
      }
    };

    // Store handlers for cleanup
    state.extendedGuidelineMouseoverHandler = mouseoverHandler;
    state.extendedGuidelineMouseoutHandler = mouseoutHandler;

    map.on("mousemove", bufferLayerId, mouseoverHandler);
    map.on("mouseout", bufferLayerId, mouseoutHandler);
  }
};

DrawPolygonDistance.removeExtendedGuidelines = function (state) {
  const map = this.map;
  if (!map) return;

  const bufferLayerId = "_snap_buffer_extended-guidelines";

  // Remove event handlers
  if (state.extendedGuidelineMouseoverHandler) {
    map.off(
      "mousemove",
      bufferLayerId,
      state.extendedGuidelineMouseoverHandler,
    );
    state.extendedGuidelineMouseoverHandler = null;
  }
  if (state.extendedGuidelineMouseoutHandler) {
    map.off("mouseout", bufferLayerId, state.extendedGuidelineMouseoutHandler);
    state.extendedGuidelineMouseoutHandler = null;
  }

  // Clear snap-hover state from the intersection point and its guidelines
  if (state.hoveredIntersectionPoint && this._ctx.snapping) {
    const feature = state.hoveredIntersectionPoint.feature;
    if (feature && feature.id !== undefined) {
      // Clear the intersection point itself
      this._ctx.snapping.setSnapHoverState(feature, false);
    }
  }

  // Remove buffer layer
  if (map.getLayer && map.getLayer(bufferLayerId)) {
    map.removeLayer(bufferLayerId);
  }

  // Remove visual layer
  if (map.getLayer && map.getLayer("extended-guidelines")) {
    map.removeLayer("extended-guidelines");
  }
  if (map.getSource && map.getSource("extended-guidelines")) {
    map.removeSource("extended-guidelines");
  }

  // Clear snapping if it's pointing to extended guidelines
  if (
    this._ctx.snapping.snappedFeature &&
    this._ctx.snapping.snappedFeature.properties &&
    this._ctx.snapping.snappedFeature.properties.isExtendedGuideline
  ) {
    this._ctx.snapping.snappedGeometry = undefined;
    this._ctx.snapping.snappedFeature = undefined;
  }

  state.extendedGuidelines = null;
  state.hoveredIntersectionPoint = null;
  state.isInExtendedGuidelinePersistenceZone = false;
  state.isActivelySnappingToGuideline = false;
  state.lastHoverPosition = null;
};

/**
 * Update the opacity of extended guidelines based on snapping state.
 * Full opacity (0.3) when actively snapping, reduced opacity (0.15) when in persistence zone.
 */
DrawPolygonDistance.updateExtendedGuidelinesOpacity = function (state) {
  const map = this.map;
  if (!map || !map.getLayer("extended-guidelines")) return;

  // Full opacity when actively snapping, half opacity when in persistence zone but not snapping
  const opacity = state.isActivelySnappingToGuideline ? 0.3 : 0.15;

  map.setPaintProperty("extended-guidelines", "line-opacity", opacity);
};

DrawPolygonDistance.showAngleReferenceLine = function (
  state,
  startPoint,
  referenceBearing,
) {
  const map = this.map;
  if (!map) return;

  // Create a line extending from startPoint along the reference bearing
  const lineLength = 0.5; // 500 meters in kilometers
  const refPoint1 = turf.destination(
    turf.point(startPoint),
    lineLength,
    referenceBearing,
    { units: "kilometers" },
  );
  const refPoint2 = turf.destination(
    turf.point(startPoint),
    lineLength,
    referenceBearing + 180,
    { units: "kilometers" },
  );

  const referenceLine = {
    type: "Feature",
    properties: { isAngleReference: true },
    geometry: {
      type: "LineString",
      coordinates: [
        refPoint2.geometry.coordinates,
        startPoint,
        refPoint1.geometry.coordinates,
      ],
    },
  };

  const featureCollection = {
    type: "FeatureCollection",
    features: [referenceLine],
  };

  // Create or update the visual layer for angle reference line
  if (!map.getSource("angle-reference-line")) {
    map.addSource("angle-reference-line", {
      type: "geojson",
      data: featureCollection,
    });

    map.addLayer({
      id: "angle-reference-line",
      type: "line",
      source: "angle-reference-line",
      paint: {
        "line-color": "#0066ff",
        "line-width": 1.5,
        "line-opacity": 0.5,
        "line-dasharray": [2, 2],
      },
    });
  } else {
    map.getSource("angle-reference-line").setData(featureCollection);
  }
};

DrawPolygonDistance.removeAngleReferenceLine = function () {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("angle-reference-line")) {
    map.removeLayer("angle-reference-line");
  }
  if (map.getSource && map.getSource("angle-reference-line")) {
    map.removeSource("angle-reference-line");
  }
};

DrawPolygonDistance.clickOnMap = function (state, e) {
  // Check if shift is held to bypass snapping
  const shiftHeld = CommonSelectors.isShiftDown(e);

  const prevVertex = state.vertices[state.vertices.length - 1];

  // Ignore click if it's on the same spot as the previous vertex (not in offset phase)
  if (state.linePhase !== 'offset' &&
      prevVertex && state.previewVertex &&
      prevVertex[0] === state.previewVertex[0] &&
      prevVertex[1] === state.previewVertex[1]) {
    return;
  }

  // First vertex - use existing snap functionality
  if (state.vertices.length === 0) {
    // Use the preview vertex if it exists (from onMouseMove), otherwise calculate it
    let vertexCoord;
    if (shiftHeld) {
      // Shift held - use raw mouse position
      vertexCoord = [e.lngLat.lng, e.lngLat.lat];
    } else if (state.previewVertex) {
      vertexCoord = state.previewVertex;
    } else {
      // Check for extended guideline intersection snapping
      const intersectionCoord = checkExtendedGuidelineIntersectionClick(
        this._ctx,
        this.map,
        state,
        e,
        this.getSnapInfo.bind(this),
      );

      vertexCoord =
        intersectionCoord ||
        (() => {
          const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
          return [snappedCoord.lng, snappedCoord.lat];
        })();
    }

    state.vertices.push(vertexCoord);
    state.polygon.updateCoordinate("0.0", vertexCoord[0], vertexCoord[1]);

    // Hide mode selector and show distance/angle UI
    hideDrawingModeSelector(state);
    showDistanceAngleUI(state);

    // Store snapped line info if snapped to a line
    const snappedCoord = { lng: vertexCoord[0], lat: vertexCoord[1] };
    const snappedLineInfo = getSnappedLineBearing(this._ctx, snappedCoord);
    if (snappedLineInfo) {
      state.snappedLineBearing = snappedLineInfo.bearing;
      state.snappedLineSegment = snappedLineInfo.segment;
    }

    // If snapping to a point, check for underlying line at click location
    const underlyingLineInfo = getUnderlyingLineBearing(
      this._ctx,
      this.map,
      e,
      snappedCoord,
    );
    if (underlyingLineInfo) {
      state.snappedLineBearing = underlyingLineInfo.bearing;
      state.snappedLineSegment = underlyingLineInfo.segment;
    }

    // Check for adjacent segments at corner points (enables perpendicular to both lines)
    const adjacentSegments = getAdjacentSegmentsAtVertex(
      this._ctx,
      this.map,
      e,
      snappedCoord
    );
    if (adjacentSegments && adjacentSegments.length > 1) {
      state.adjacentSegments = adjacentSegments;
    } else {
      state.adjacentSegments = null;
    }
    return;
  }

  // Rectangle mode: after 2 vertices (edge defined), complete the rectangle
  if (state.drawingSubMode === DRAWING_SUB_MODES.RECTANGLE && state.vertices.length === 2) {
    const rectVertex = state.previewVertex || [e.lngLat.lng, e.lngLat.lat];
    this.completeRectangle(state, rectVertex);
    return;
  }

  // Line mode offset phase: click to confirm the offset width
  if (state.drawingSubMode === DRAWING_SUB_MODES.LINE && state.linePhase === 'offset') {
    this.completeLineOffset(state);
    return;
  }

  // Subsequent vertices - use preview vertex if available (from onMouseMove)
  // This ensures the vertex is placed exactly where the black dot indicator shows
  if (state.previewVertex) {
    const newVertex = state.previewVertex;

    // Check for polygon closing (not in line mode)
    if (state.drawingSubMode !== DRAWING_SUB_MODES.LINE && state.vertices.length >= 3) {
      const firstVertex = state.vertices[0];
      const dist = turf.distance(
        turf.point(firstVertex),
        turf.point(newVertex),
        {
          units: "meters",
        },
      );

      if (dist < 10) {
        this.finishDrawing(state);
        return;
      }
    }

    state.vertices.push(newVertex);
    state.polygon.updateCoordinate(
      `0.${state.vertices.length - 1}`,
      newVertex[0],
      newVertex[1],
    );

    // Store snapped line info if snapped to a line
    const snappedCoord = { lng: newVertex[0], lat: newVertex[1] };
    const snappedLineInfo = getSnappedLineBearing(this._ctx, snappedCoord);
    if (snappedLineInfo) {
      state.snappedLineBearing = snappedLineInfo.bearing;
      state.snappedLineSegment = snappedLineInfo.segment;
    } else {
      state.snappedLineBearing = null;
      state.snappedLineSegment = null;
    }

    // Check for adjacent segments at corner points (enables perpendicular to both lines)
    const adjacentSegments = getAdjacentSegmentsAtVertex(
      this._ctx,
      this.map,
      e,
      snappedCoord
    );
    if (adjacentSegments && adjacentSegments.length > 1) {
      state.adjacentSegments = adjacentSegments;
    } else {
      state.adjacentSegments = null;
    }

    // Clear distance and angle inputs for next segment
    if (state.distanceInput) {
      state.distanceInput.value = "";
      state.currentDistance = null;
      state.distanceInput.focus();
    }
    if (state.angleInput) {
      state.angleInput.value = "";
      state.currentAngle = null;
    }

    return;
  }

  // Fallback: recalculate if preview vertex is not available
  let newVertex;
  const lastVertex = state.vertices[state.vertices.length - 1];
  const from = turf.point(lastVertex);
  const hasUserDistance =
    state.currentDistance !== null && state.currentDistance > 0;

  // If shift held, use raw mouse position (bypass snapping)
  if (shiftHeld) {
    newVertex = [e.lngLat.lng, e.lngLat.lat];

    // Check for polygon closing (not in line mode)
    if (state.drawingSubMode !== DRAWING_SUB_MODES.LINE && state.vertices.length >= 3) {
      const firstVertex = state.vertices[0];
      const dist = turf.distance(
        turf.point(firstVertex),
        turf.point(newVertex),
        { units: "meters" }
      );
      if (dist < 10) {
        this.finishDrawing(state);
        return;
      }
    }

    state.vertices.push(newVertex);
    state.polygon.updateCoordinate(
      `0.${state.vertices.length - 1}`,
      newVertex[0],
      newVertex[1]
    );
    state.snappedLineBearing = null;
    state.snappedLineSegment = null;

    // Clear distance and angle inputs for next segment
    if (state.distanceInput) {
      state.distanceInput.value = "";
      state.currentDistance = null;
      state.distanceInput.focus();
    }
    if (state.angleInput) {
      state.angleInput.value = "";
      state.currentAngle = null;
    }
    return;
  }

  // Get snap info (point or line)
  let snapInfo = null;

  // If extended guidelines are active, use exclusive snapping
  if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
    // ONLY snap to: 1) extended guideline, 2) intersections with other lines
    const snapping = this._ctx.snapping;
    if (snapping && snapping.snappedFeature) {
      const isExtendedGuideline =
        snapping.snappedFeature.properties &&
        snapping.snappedFeature.properties.isExtendedGuideline;

      if (isExtendedGuideline) {
        // Snapping to extended guideline
        snapInfo = this.getSnapInfo(e.lngLat);

        // Check if there are any nearby lines that intersect with the extended guideline
        const bufferLayers = snapping.bufferLayers.map(
          (layerId) => "_snap_buffer_" + layerId,
        );
        const allFeaturesAtPoint = this.map.queryRenderedFeatures(e.point, {
          layers: bufferLayers,
        });

        // Look for a non-extended-guideline line feature
        const otherLineFeature = allFeaturesAtPoint.find((feature) => {
          if (feature.properties && feature.properties.isExtendedGuideline) {
            return false;
          }
          const geomType = feature.geometry.type;
          return (
            geomType === "LineString" ||
            geomType === "MultiLineString" ||
            geomType === "Polygon" ||
            geomType === "MultiPolygon"
          );
        });

        if (otherLineFeature && snapInfo) {
          let otherGeom = otherLineFeature.geometry;
          if (
            otherGeom.type === "Polygon" ||
            otherGeom.type === "MultiPolygon"
          ) {
            otherGeom = turf.polygonToLine(otherGeom).geometry;
          }

          if (
            otherGeom.type === "LineString" ||
            otherGeom.type === "MultiLineString"
          ) {
            const snapPoint = turf.point([e.lngLat.lng, e.lngLat.lat]);
            const coords =
              otherGeom.type === "LineString"
                ? otherGeom.coordinates
                : otherGeom.coordinates.flat();

            const result = findNearestSegment(coords, snapPoint);
            if (result) {
              const otherLineSnapInfo = {
                type: "line",
                coord: snapInfo.coord,
                bearing: turf.bearing(
                  turf.point(result.segment.start),
                  turf.point(result.segment.end),
                ),
                segment: result.segment,
                snappedFeature: otherLineFeature,
              };

              const intersectionSnap = findExtendedGuidelineIntersection(
                state.extendedGuidelines,
                otherLineSnapInfo,
                e.lngLat,
                state.snapTolerance,
              );
              if (intersectionSnap) {
                snapInfo = intersectionSnap;
              }
            }
          }
        }
      } else {
        // Snapping to something else - check if it's a snappingPoint or a line that intersects with extended guideline
        const tempSnapInfo = this.getSnapInfo(e.lngLat);

        // Check if this is a snappingPoint (corner/intersection point) - always allow snapping to these
        const isSnappingPoint =
          snapping.snappedFeature.properties &&
          snapping.snappedFeature.properties.type === 'snappingPoint';

        if (isSnappingPoint && tempSnapInfo && tempSnapInfo.type === 'point') {
          // Allow snapping to snappingPoints even when extended guidelines are active
          snapInfo = tempSnapInfo;
        } else if (tempSnapInfo && tempSnapInfo.type === "line") {
          const intersectionSnap = findExtendedGuidelineIntersection(
            state.extendedGuidelines,
            tempSnapInfo,
            e.lngLat,
            state.snapTolerance,
          );
          if (intersectionSnap) {
            snapInfo = intersectionSnap;
          }
        }
      }
    }
  } else {
    // No extended guidelines - use regular snapping
    snapInfo = this.getSnapInfo(e.lngLat);
  }

  // Calculate mouse bearing for orthogonal snap check
  const mouseBearing = turf.bearing(
    from,
    turf.point([e.lngLat.lng, e.lngLat.lat]),
  );

  // Check for closing perpendicular snap (perpendicular to first segment)
  let closingPerpendicularSnap = null;
  if (state.vertices.length >= 2) {
    const firstVertex = state.vertices[0];
    const secondVertex = state.vertices[1];
    const firstSegmentBearing = turf.bearing(
      turf.point(firstVertex),
      turf.point(secondVertex),
    );
    const bearingToFirst = turf.bearing(
      turf.point([e.lngLat.lng, e.lngLat.lat]),
      turf.point(firstVertex),
    );

    // Check if bearing to first vertex is perpendicular to first segment (90° or 270°)
    for (const angle of [90, 270]) {
      const targetBearing = firstSegmentBearing + angle;
      const normalizedTarget = ((targetBearing % 360) + 360) % 360;
      const normalizedToFirst = ((bearingToFirst % 360) + 360) % 360;

      let diff = Math.abs(normalizedTarget - normalizedToFirst);
      if (diff > 180) diff = 360 - diff;

      if (diff <= 5) {
        closingPerpendicularSnap = {
          firstVertex: firstVertex,
          perpendicularBearing: targetBearing,
          firstSegmentBearing: firstSegmentBearing,
        };
        break;
      }
    }
  }

  // Check orthogonal snapping - either to previous segment OR to extended guidelines
  const extendedGuidelinesActive =
    state.extendedGuidelines && state.extendedGuidelines.length > 0;

  let orthogonalMatch = null;
  let isPerpendicularToGuideline = false;

  if (extendedGuidelinesActive && state.vertices.length >= 1) {
    // When extended guidelines are active, check for orthogonal (perpendicular/parallel) to guideline bearings
    const guidelineBearings = getExtendedGuidelineBearings(state.extendedGuidelines);
    orthogonalMatch = getPerpendicularToGuidelineBearing(
      guidelineBearings,
      mouseBearing,
      this._ctx.options.orthogonalSnapTolerance
    );
    if (orthogonalMatch) {
      isPerpendicularToGuideline = true;
    }
  } else if (!extendedGuidelinesActive) {
    // Regular orthogonal snapping to previous segment or snapped line
    orthogonalMatch = this.getOrthogonalBearing(
      state,
      mouseBearing,
      this._ctx.options.orthogonalSnapTolerance
    );
  }

  // Detect parallel lines nearby (orthogonal intersection method, configurable tolerance)
  let parallelLineMatch = null;
  if (!extendedGuidelinesActive && state.vertices.length >= 1) {
    const nearbyLines = findNearbyParallelLines(
      this._ctx,
      this.map,
      lastVertex,
      e.lngLat,
    );
    parallelLineMatch = getParallelBearing(
      nearbyLines,
      mouseBearing,
      this._ctx.options.parallelSnapTolerance,
    );
  }

  // Check for perpendicular-to-line snap (when snapping to a line)
  let perpendicularToLineSnap = null;
  if (
    !extendedGuidelinesActive &&
    state.vertices.length >= 1 &&
    snapInfo &&
    snapInfo.type === "line"
  ) {
    const perpPoint = calculatePerpendicularToLine(
      lastVertex,
      snapInfo.segment,
      e.lngLat,
    );
    if (perpPoint) {
      perpendicularToLineSnap = {
        coord: perpPoint.coord,
        distanceFromCursor: perpPoint.distanceFromCursor,
        lineSegment: snapInfo.segment,
        lineBearing: snapInfo.bearing,
      };
    }
  }

  // Check if BOTH regular orthogonal AND closing perpendicular are active
  const bothSnapsActive =
    !extendedGuidelinesActive &&
    orthogonalMatch !== null &&
    closingPerpendicularSnap !== null &&
    !(snapInfo && snapInfo.type === "point");

  // Resolve conflicts between orthogonal, parallel, and bothSnapsActive snapping
  const resolved = resolveSnapConflicts({
    orthogonalMatch,
    parallelLineMatch,
    bothSnapsActive,
    lastVertex,
    lngLat: e.lngLat,
    closingPerpendicularSnap,
    proximityThreshold: this._ctx.options.parallelSnapProximityThreshold,
    mouseBearing,
  });
  orthogonalMatch = resolved.orthogonalMatch;
  parallelLineMatch = resolved.parallelLineMatch;

  // Check if perpendicular-to-line snap should override regular line snap
  // This happens when cursor is close to the perpendicular point (within snap tolerance)
  const snapTolerance = this._ctx.options.snapDistance || 20; // pixels
  const metersPerPixel =
    (156543.03392 * Math.cos((e.lngLat.lat * Math.PI) / 180)) /
    Math.pow(2, this.map.getZoom());
  const snapToleranceMeters = snapTolerance * metersPerPixel;

  let isPerpendicularToLineSnap = false;
  if (
    perpendicularToLineSnap &&
    perpendicularToLineSnap.distanceFromCursor <= snapToleranceMeters
  ) {
    // Within snap tolerance - check if perpendicular snap should win based on proximity
    // Compare with orthogonal and parallel snaps
    let shouldUsePerpendicular = true;

    if (orthogonalMatch !== null) {
      // Calculate distance to orthogonal snap point
      const orthogonalPoint = turf.destination(
        from,
        0.1,
        orthogonalMatch.bearing,
        { units: "kilometers" },
      );
      const orthogonalDist = turf.distance(
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        orthogonalPoint,
        { units: "meters" },
      );
      if (orthogonalDist < perpendicularToLineSnap.distanceFromCursor) {
        shouldUsePerpendicular = false;
      }
    }

    if (shouldUsePerpendicular && parallelLineMatch !== null) {
      // Calculate distance to parallel snap point
      const parallelPoint = turf.destination(
        from,
        0.1,
        parallelLineMatch.bearing,
        { units: "kilometers" },
      );
      const parallelDist = turf.distance(
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        parallelPoint,
        { units: "meters" },
      );
      if (parallelDist < perpendicularToLineSnap.distanceFromCursor) {
        shouldUsePerpendicular = false;
      }
    }

    if (shouldUsePerpendicular) {
      // Override snapInfo to use perpendicular point as a point snap
      snapInfo = {
        type: "point",
        coord: perpendicularToLineSnap.coord,
        snappedFeature: snapInfo.snappedFeature,
      };
      isPerpendicularToLineSnap = true;
      // Clear orthogonal and parallel snaps since perpendicular won
      orthogonalMatch = null;
      parallelLineMatch = null;
    }
  }

  // Store perpendicular-to-line snap state for indicator
  state.perpendicularToLineSnap = isPerpendicularToLineSnap
    ? perpendicularToLineSnap
    : null;

  // Determine reference bearing for angle input
  let referenceBearing = 0; // Default to true north
  if (state.vertices.length >= 2) {
    const secondLastVertex = state.vertices[state.vertices.length - 2];
    referenceBearing = turf.bearing(turf.point(secondLastVertex), from);
  } else if (state.snappedLineBearing !== null) {
    referenceBearing = state.snappedLineBearing;
  }

  // Determine direction (bearing) priority
  let bearingToUse = mouseBearing;
  let usePointDirection = false;
  let isOrthogonalSnap = false;
  let isClosingPerpendicularSnap = false;
  let isParallelLineSnap = false;
  const hasUserAngle =
    state.currentAngle !== null && !isNaN(state.currentAngle);

  // Show/hide angle reference line based on whether angle input is active
  if (hasUserAngle) {
    this.showAngleReferenceLine(state, lastVertex, referenceBearing);
  } else {
    this.removeAngleReferenceLine();
  }

  if (hasUserAngle) {
    // Priority 0: User-entered angle (highest priority for direction)
    bearingToUse = referenceBearing + state.currentAngle;
  } else if (snapInfo && snapInfo.type === "point") {
    // Priority 1: Point snap direction
    bearingToUse = turf.bearing(from, turf.point(snapInfo.coord));
    usePointDirection = true;
  } else if (snapInfo && snapInfo.type === "line") {
    // Priority 2: Line snap bearing - takes priority over bearing-based snaps
    bearingToUse = snapInfo.bearing;
  } else if (bothSnapsActive) {
    // Priority 3: Both orthogonal and closing perpendicular are active (only when no concrete snap)
    isOrthogonalSnap = true;
    isClosingPerpendicularSnap = true;
  } else if (orthogonalMatch !== null && (!extendedGuidelinesActive || isPerpendicularToGuideline)) {
    // Priority 4: Bearing snap (orthogonal/parallel to previous segment, snapped line, or extended guideline)
    // Only activates when no concrete snap target nearby
    bearingToUse = orthogonalMatch.bearing;
    isOrthogonalSnap = true;
  } else if (parallelLineMatch !== null && !extendedGuidelinesActive) {
    // Priority 5: Parallel line snap (snap to bearing of nearby lines)
    // Only activates when no concrete snap target nearby
    bearingToUse = parallelLineMatch.bearing;
    isParallelLineSnap = true;
  } else if (closingPerpendicularSnap !== null && !extendedGuidelinesActive) {
    // Priority 6: Closing perpendicular snap
    // Only activates when no concrete snap target nearby
    isClosingPerpendicularSnap = true;
  }

  // Determine length priority
  if (hasUserDistance) {
    // Priority 1 for length: User-entered distance
    // If we have a point snap (including intersection points), use it directly
    if (snapInfo && snapInfo.type === "point") {
      newVertex = snapInfo.coord;
    } else if (snapInfo && snapInfo.type === "line") {
      // If we have a line snap, use circle-line intersection to find the correct point
      const circleLineIntersection = calculateCircleLineIntersection(
        lastVertex,
        state.currentDistance,
        snapInfo.segment,
        [e.lngLat.lng, e.lngLat.lat],
      );
      if (circleLineIntersection) {
        newVertex = circleLineIntersection.coord;
      } else {
        // Fallback: if no intersection found, use bearing to create point at exact distance
        const destinationPoint = turf.destination(
          from,
          state.currentDistance / 1000,
          bearingToUse,
          { units: "kilometers" },
        );
        newVertex = destinationPoint.geometry.coordinates;
      }
    } else {
      // No snap: use bearing to create point at exact distance
      const destinationPoint = turf.destination(
        from,
        state.currentDistance / 1000,
        bearingToUse,
        { units: "kilometers" },
      );
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else if (bothSnapsActive) {
    // Special case: Both orthogonal and closing perpendicular are active
    // Find intersection where both constraints are satisfied
    const perpLine = {
      start: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing + 180,
        { units: "kilometers" },
      ).geometry.coordinates,
      end: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing,
        { units: "kilometers" },
      ).geometry.coordinates,
    };

    const intersection = calculateLineIntersection(
      lastVertex,
      orthogonalMatch.bearing,
      perpLine,
    );
    if (intersection) {
      newVertex = intersection.coord;
    } else {
      // Fallback to mouse distance
      const mouseDistance = turf.distance(
        from,
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        { units: "kilometers" },
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        orthogonalMatch.bearing,
        { units: "kilometers" },
      );
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else if (
    closingPerpendicularSnap !== null &&
    !usePointDirection &&
    !isOrthogonalSnap &&
    !snapInfo
  ) {
    // Closing perpendicular snap: find intersection where closing segment is perpendicular to first segment
    // Only activates when no concrete snap target nearby
    const perpLine = {
      start: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing + 180,
        { units: "kilometers" },
      ).geometry.coordinates,
      end: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing,
        { units: "kilometers" },
      ).geometry.coordinates,
    };

    const intersection = calculateLineIntersection(
      lastVertex,
      mouseBearing,
      perpLine,
    );
    if (intersection) {
      newVertex = intersection.coord;
    } else {
      // Fallback to mouse position
      const mouseDistance = turf.distance(
        from,
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        { units: "kilometers" },
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        mouseBearing,
        { units: "kilometers" },
      );
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else if (usePointDirection && snapInfo) {
    // Point snap: use distance to point
    newVertex = snapInfo.coord;
  } else if (snapInfo && snapInfo.type === "line") {
    // Line snap: use snapped position
    newVertex = snapInfo.coord;
  } else {
    // No snap: use mouse distance with bearing
    const mouseDistance = turf.distance(
      from,
      turf.point([e.lngLat.lng, e.lngLat.lat]),
      { units: "kilometers" },
    );
    const destinationPoint = turf.destination(
      from,
      mouseDistance,
      bearingToUse,
      { units: "kilometers" },
    );
    newVertex = destinationPoint.geometry.coordinates;
  }

  // Check for polygon closing (not in line mode)
  if (state.drawingSubMode !== DRAWING_SUB_MODES.LINE && state.vertices.length >= 3) {
    const firstVertex = state.vertices[0];
    const dist = turf.distance(turf.point(firstVertex), turf.point(newVertex), {
      units: "meters",
    });

    if (dist < 10) {
      this.finishDrawing(state);
      return;
    }
  }

  // Check if orthogonal/parallel/bearing snap brought us very close to an existing vertex
  // If yes, snap exactly to that vertex to maintain geometric precision (fixes chaining errors)
  if (isOrthogonalSnap || isParallelLineSnap || isClosingPerpendicularSnap) {
    const nearbyVertex = snapToNearbyVertex(newVertex, state.vertices, 0.5);
    if (nearbyVertex) {
      newVertex = nearbyVertex;
    }
  }

  state.vertices.push(newVertex);
  state.polygon.updateCoordinate(
    `0.${state.vertices.length - 1}`,
    newVertex[0],
    newVertex[1],
  );

  // Store snapped line info if snapped to a line
  const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
  const snappedLineInfo = getSnappedLineBearing(this._ctx, snappedCoord);
  if (snappedLineInfo) {
    state.snappedLineBearing = snappedLineInfo.bearing;
    state.snappedLineSegment = snappedLineInfo.segment;
  } else {
    state.snappedLineBearing = null;
    state.snappedLineSegment = null;
  }

  // Clear distance and angle inputs for next segment
  if (state.distanceInput) {
    state.distanceInput.value = "";
    state.currentDistance = null;
    state.distanceInput.focus();
  }
  if (state.angleInput) {
    state.angleInput.value = "";
    state.currentAngle = null;
  }
};

DrawPolygonDistance.onMouseMove = function (state, e) {
  const pointOnScreen = e.point;
  const lngLat = e.lngLat;

  state.currentPosition = lngLat;
  state.lastPoint = pointOnScreen;

  // Throttle heavy computations to avoid performance issues
  const now = Date.now();
  const shouldRunHeavyCompute = (now - lastHeavyComputeTime) >= HEAVY_COMPUTE_THROTTLE_MS;
  if (shouldRunHeavyCompute) {
    lastHeavyComputeTime = now;
  }

  // Check if shift is held to temporarily disable snapping
  const shiftHeld = CommonSelectors.isShiftDown(e);
  const inRectanglePhase = state.drawingSubMode === DRAWING_SUB_MODES.RECTANGLE && state.vertices.length === 2;
  const inLineOffsetPhase = state.drawingSubMode === DRAWING_SUB_MODES.LINE && state.linePhase === 'offset';
  if (shiftHeld && state.vertices.length >= 1 && !inRectanglePhase && !inLineOffsetPhase) {
    // Shift held - use raw mouse position, bypass all snapping
    const lastVertex = state.vertices[state.vertices.length - 1];
    const from = turf.point(lastVertex);
    const previewVertex = [lngLat.lng, lngLat.lat];

    // Calculate actual distance to preview vertex
    const actualDistance = turf.distance(from, turf.point(previewVertex), TURF_UNITS_M);

    // Update distance label only
    this.updateDistanceLabel(state, lastVertex, previewVertex, actualDistance);

    // Clear all snap indicators
    this.removeRightAngleIndicator(state);
    this.removeClosingRightAngleIndicator(state);
    this.removeGuideCircle(state);
    this.removePreviewPoint(state);
    this.removeLineSegmentSplitLabels(state);
    this.removeParallelLineIndicators(state);
    this.removeCollinearSnapLine(state);

    // Clear the snap vertex indicator (black dot) and snapping state
    if (this._ctx.snapping) {
      this._ctx.snapping.clearSnapCoord();
      if (this._ctx.snapping.snappedFeature) {
        this._ctx.snapping.setSnapHoverState(this._ctx.snapping.snappedFeature, false);
      }
      this._ctx.snapping.snappedFeature = undefined;
      this._ctx.snapping.snappedGeometry = undefined;
    }

    // Store preview vertex
    state.previewVertex = previewVertex;

    // Update polygon preview
    const coords = state.vertices.map(v => v);
    coords.push(previewVertex);
    if (state.drawingSubMode !== DRAWING_SUB_MODES.LINE) {
      coords.push(state.vertices[0]); // Close the polygon
    }
    state.polygon.setCoordinates([coords]);
    return;
  }

  // Rectangle mode: constrain to perpendicular after edge is defined
  if (inRectanglePhase) {
    if (shiftHeld && this._ctx.snapping) {
      this._ctx.snapping.clearSnapCoord();
      this._ctx.snapping.snappedFeature = undefined;
      this._ctx.snapping.snappedGeometry = undefined;
    }
    this.handleRectanglePreview(state, e);
    return;
  }

  // Line mode offset phase: show offset polygon preview
  if (inLineOffsetPhase) {
    if (shiftHeld && this._ctx.snapping) {
      this._ctx.snapping.clearSnapCoord();
      this._ctx.snapping.snappedFeature = undefined;
      this._ctx.snapping.snappedGeometry = undefined;
    }
    this.handleLineOffsetPreview(state, e);
    return;
  }

  // Handle extended guideline hover logic
  const intersectionPointInfo = this.detectHoveredIntersectionPoint(state, e);

  if (intersectionPointInfo) {
    // Hovering over an intersection point
    const currentCoord = intersectionPointInfo.coord;

    // Check if this is a different point than what we're already hovering
    const isDifferentPoint =
      !state.hoveredIntersectionPoint ||
      state.hoveredIntersectionPoint.coord[0] !== currentCoord[0] ||
      state.hoveredIntersectionPoint.coord[1] !== currentCoord[1];

    if (isDifferentPoint) {
      // Check if we have existing extended guidelines and are within their persistence zone
      let keepExistingGuidelines = false;
      if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
        const snapDistance = this._ctx.options.snapDistance || 20;
        const persistenceZone = snapDistance * 5;
        const pixelDistanceToGuideline = calculatePixelDistanceToExtendedGuidelines(
          this.map,
          state.extendedGuidelines,
          lngLat
        );
        keepExistingGuidelines = pixelDistanceToGuideline <= persistenceZone;
      }

      if (keepExistingGuidelines) {
        // We're within persistence zone of existing guidelines - keep them
        // Clear snap-hover state for the different point we detected but won't use
        if (intersectionPointInfo.feature && this._ctx.snapping) {
          this._ctx.snapping.setSnapHoverState(intersectionPointInfo.feature, false);
        }
        // Update opacity to faded since we're not actively snapping to them
        state.isActivelySnappingToGuideline = false;
        state.isInExtendedGuidelinePersistenceZone = true;
        this.updateExtendedGuidelinesOpacity(state);
        // Don't start new debounce for the different point
      } else {
        // Clear existing debounce timer and extended guidelines
        if (state.hoverDebounceTimer) {
          clearTimeout(state.hoverDebounceTimer);
          state.hoverDebounceTimer = null;
        }
        this.removeExtendedGuidelines(state);

        // Store new hover point
        state.hoveredIntersectionPoint = intersectionPointInfo;
        state.lastHoverPosition = [lngLat.lng, lngLat.lat];

        // Start new debounce timer (500ms)
        state.hoverDebounceTimer = setTimeout(() => {
          // Extend and render guidelines
          const extendedLines = this.extendGuidelines(
            state,
            intersectionPointInfo,
          );
          state.extendedGuidelines = extendedLines;
          this.renderExtendedGuidelines(state, extendedLines);
          // Set initial opacity state - actively snapping since we're hovering intersection
          state.isActivelySnappingToGuideline = true;
          state.isInExtendedGuidelinePersistenceZone = true;
        }, 500);
      }
    } else if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
      // Same point, guidelines exist - update opacity to full since we're on the intersection
      state.isActivelySnappingToGuideline = true;
      state.isInExtendedGuidelinePersistenceZone = true;
      this.updateExtendedGuidelinesOpacity(state);
    }
  } else {
    // Not hovering over an intersection point
    // Check if we're within the persistence zone (5x snap distance) of extended guidelines
    if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
      const snapDistance = this._ctx.options.snapDistance || 20;
      const persistenceZone = snapDistance * 5; // 5x snap distance for persistence
      const pixelDistanceToGuideline = calculatePixelDistanceToExtendedGuidelines(
        this.map,
        state.extendedGuidelines,
        lngLat
      );

      // Update state for whether we're actively snapping or just in persistence zone
      state.isActivelySnappingToGuideline = state.isHoveringExtendedGuidelines;
      state.isInExtendedGuidelinePersistenceZone = pixelDistanceToGuideline <= persistenceZone;

      // Update guideline opacity based on snapping state
      this.updateExtendedGuidelinesOpacity(state);

      // Only remove guidelines if we're outside the persistence zone
      if (!state.isInExtendedGuidelinePersistenceZone) {
        if (state.hoverDebounceTimer) {
          clearTimeout(state.hoverDebounceTimer);
          state.hoverDebounceTimer = null;
        }
        this.removeExtendedGuidelines(state);
      }
    } else if (!state.isHoveringExtendedGuidelines) {
      // No guidelines exist yet, clear any pending debounce timer
      if (state.hoverDebounceTimer) {
        clearTimeout(state.hoverDebounceTimer);
        state.hoverDebounceTimer = null;
      }
    }
  }

  // Check for line snapping even before first vertex is placed
  if (state.vertices.length === 0) {
    let snapInfo = null;

    // If extended guidelines are active, use exclusive snapping
    if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
      // FIRST: Check if cursor is near the intersection point that triggered the guidelines
      // This has highest priority since extended guideline buffer may overlap the point
      if (state.hoveredIntersectionPoint) {
        const intersectionCoord = state.hoveredIntersectionPoint.coord;
        const distToIntersection = turf.distance(
          turf.point(intersectionCoord),
          turf.point([lngLat.lng, lngLat.lat]),
          TURF_UNITS_M
        );
        const metersPerPixel = 156543.03392 * Math.cos(lngLat.lat * Math.PI / 180) / Math.pow(2, this.map.getZoom());
        const snapToleranceMeters = (this._ctx.options.snapDistance || 20) * metersPerPixel;

        if (distToIntersection <= snapToleranceMeters) {
          snapInfo = {
            type: 'point',
            coord: intersectionCoord,
            snappedFeature: state.hoveredIntersectionPoint.feature
          };
        }
      }

      // Check for intersections between extended guidelines and ANY snap lines (proactive search)
      if (!snapInfo) {
        const metersPerPixel = 156543.03392 * Math.cos(lngLat.lat * Math.PI / 180) / Math.pow(2, this.map.getZoom());
        const snapToleranceMeters = (this._ctx.options.snapDistance || 20) * metersPerPixel;
        const guidelineIntersection = findAllGuidelineIntersections(
          this.map,
          this._ctx.snapping,
          state.extendedGuidelines,
          lngLat,
          snapToleranceMeters
        );
        if (guidelineIntersection) {
          snapInfo = guidelineIntersection;
        }
      }

      // Only continue with other snapping if we didn't snap to an intersection point
      if (!snapInfo) {
        // ONLY snap to: 1) extended guideline intersections with other lines, 2) extended guideline itself

        // Check what the snapping system is currently snapping to
        const snapping = this._ctx.snapping;
        if (snapping && snapping.snappedFeature) {
          const isExtendedGuideline =
            snapping.snappedFeature.properties &&
            snapping.snappedFeature.properties.isExtendedGuideline;

          if (isExtendedGuideline) {
            // Snapping to extended guideline - check for intersections with OTHER nearby lines first
            const guidelineSnapInfo = this.getSnapInfo(lngLat);

            // Query for other line features near the cursor that might intersect the guideline
            const bufferLayers = snapping.bufferLayers.map(layerId => '_snap_buffer_' + layerId);
            const allFeaturesAtPoint = this.map.queryRenderedFeatures(e.point, {
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

            if (otherLineFeature && guidelineSnapInfo) {
              // Found another line - check for intersection with extended guideline
              let otherGeom = otherLineFeature.geometry;
              if (otherGeom.type === 'Polygon' || otherGeom.type === 'MultiPolygon') {
                otherGeom = turf.polygonToLine(otherGeom).geometry;
              }

              if (otherGeom.type === 'LineString' || otherGeom.type === 'MultiLineString') {
                const snapPoint = turf.point([lngLat.lng, lngLat.lat]);
                const coords = otherGeom.type === 'LineString' ? otherGeom.coordinates : otherGeom.coordinates.flat();

                const result = findNearestSegment(coords, snapPoint);
                if (result) {
                  const otherLineSnapInfo = {
                    type: 'line',
                    coord: guidelineSnapInfo.coord,
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
                    lngLat,
                    state.snapTolerance
                  );
                  if (intersectionSnap) {
                    snapInfo = intersectionSnap;
                  }
                }
              }
            }

            // If no intersection found, use the guideline snap
            if (!snapInfo) {
              snapInfo = guidelineSnapInfo;
            }
          } else {
            // Snapping to something else - check if it's a snappingPoint or a line that intersects with extended guideline
            const tempSnapInfo = this.getSnapInfo(lngLat);

            // Check if this is a snappingPoint (corner/intersection point) - always allow snapping to these
            const isSnappingPoint =
              snapping.snappedFeature.properties &&
              snapping.snappedFeature.properties.type === 'snappingPoint';

            if (isSnappingPoint && tempSnapInfo && tempSnapInfo.type === 'point') {
              // Allow snapping to snappingPoints even when extended guidelines are active
              snapInfo = tempSnapInfo;
            } else if (tempSnapInfo && tempSnapInfo.type === "line") {
              // It's a line - check for intersection with extended guideline
              const intersectionSnap = findExtendedGuidelineIntersection(
                state.extendedGuidelines,
                tempSnapInfo,
                lngLat,
                state.snapTolerance,
              );
              if (intersectionSnap) {
                snapInfo = intersectionSnap;
              }
            }
          }
        }
      }
    } else {
      // No extended guidelines - use regular snapping
      snapInfo = this.getSnapInfo(lngLat);
    }

    // Check if snapping to extended guideline
    const isSnappingToExtendedGuideline =
      snapInfo &&
      snapInfo.type === "line" &&
      snapInfo.snappedFeature &&
      snapInfo.snappedFeature.properties &&
      snapInfo.snappedFeature.properties.isExtendedGuideline;

    if (
      snapInfo &&
      snapInfo.type === "line" &&
      !isSnappingToExtendedGuideline
    ) {
      const snappedCoord = this._ctx.snapping.snapCoord(lngLat);
      this.updateLineSegmentSplitLabels(state, snapInfo.segment, [
        snappedCoord.lng,
        snappedCoord.lat,
      ]);
    } else if (snapInfo && snapInfo.type === "point") {
      // Check for underlying line at the point snap location
      const underlyingLineInfo = getUnderlyingLineBearing(
        this._ctx,
        this.map,
        e,
        { lng: snapInfo.coord[0], lat: snapInfo.coord[1] },
      );
      if (underlyingLineInfo && underlyingLineInfo.segment) {
        this.updateLineSegmentSplitLabels(
          state,
          underlyingLineInfo.segment,
          snapInfo.coord,
        );
      } else {
        this.removeLineSegmentSplitLabels(state);
      }
    } else {
      this.removeLineSegmentSplitLabels(state);
    }

    // Only show preview point when actually snapping to something
    if (snapInfo) {
      // Store preview vertex in state so it can be used in clickOnMap
      state.previewVertex = snapInfo.coord;
      this.updatePreviewPoint(state, snapInfo.coord);
    } else {
      state.previewVertex = null;
      this.removePreviewPoint(state);
    }

    return;
  }

  // Calculate preview position using new priority system
  let previewVertex;
  const lastVertex = state.vertices[state.vertices.length - 1];
  const from = turf.point(lastVertex);
  const hasUserDistance =
    state.currentDistance !== null && state.currentDistance > 0;

  // Get snap info (point or line)
  let snapInfo = null;

  // If extended guidelines are active, use exclusive snapping
  if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
    // FIRST: Check if cursor is near the intersection point that triggered the guidelines
    // This has highest priority since extended guideline buffer may overlap the point
    if (state.hoveredIntersectionPoint) {
      const intersectionCoord = state.hoveredIntersectionPoint.coord;
      const distToIntersection = turf.distance(
        turf.point(intersectionCoord),
        turf.point([lngLat.lng, lngLat.lat]),
        TURF_UNITS_M
      );
      const metersPerPixel = 156543.03392 * Math.cos(lngLat.lat * Math.PI / 180) / Math.pow(2, this.map.getZoom());
      const snapToleranceMeters = (this._ctx.options.snapDistance || 20) * metersPerPixel;

      if (distToIntersection <= snapToleranceMeters) {
        snapInfo = {
          type: 'point',
          coord: intersectionCoord,
          snappedFeature: state.hoveredIntersectionPoint.feature
        };
      }
    }

    // Check for intersections between extended guidelines and ANY snap lines (proactive search)
    if (!snapInfo) {
      const metersPerPixel = 156543.03392 * Math.cos(lngLat.lat * Math.PI / 180) / Math.pow(2, this.map.getZoom());
      const snapToleranceMeters = (this._ctx.options.snapDistance || 20) * metersPerPixel;
      const guidelineIntersection = findAllGuidelineIntersections(
        this.map,
        this._ctx.snapping,
        state.extendedGuidelines,
        lngLat,
        snapToleranceMeters
      );
      if (guidelineIntersection) {
        snapInfo = guidelineIntersection;
      }
    }

    // Only continue with other snapping if we didn't snap to an intersection point
    if (!snapInfo) {
      // ONLY snap to: 1) extended guideline, 2) intersections with other lines

      // Check what the snapping system is currently snapping to
      const snapping = this._ctx.snapping;
      if (snapping && snapping.snappedFeature) {
        const isExtendedGuideline =
          snapping.snappedFeature.properties &&
          snapping.snappedFeature.properties.isExtendedGuideline;

        if (isExtendedGuideline) {
          // Snapping to extended guideline - check for intersections with OTHER nearby lines first
          const guidelineSnapInfo = this.getSnapInfo(lngLat);

          // Query for other line features near the cursor that might intersect the guideline
          const bufferLayers = snapping.bufferLayers.map(layerId => '_snap_buffer_' + layerId);
          const allFeaturesAtPoint = this.map.queryRenderedFeatures(e.point, {
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

          if (otherLineFeature && guidelineSnapInfo) {
            // Found another line - check for intersection with extended guideline
            let otherGeom = otherLineFeature.geometry;
            if (otherGeom.type === 'Polygon' || otherGeom.type === 'MultiPolygon') {
              otherGeom = turf.polygonToLine(otherGeom).geometry;
            }

            if (otherGeom.type === 'LineString' || otherGeom.type === 'MultiLineString') {
              const snapPoint = turf.point([lngLat.lng, lngLat.lat]);
              const coords = otherGeom.type === 'LineString' ? otherGeom.coordinates : otherGeom.coordinates.flat();

              const result = findNearestSegment(coords, snapPoint);
              if (result) {
                const otherLineSnapInfo = {
                  type: 'line',
                  coord: guidelineSnapInfo.coord,
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
                  lngLat,
                  state.snapTolerance
                );
                if (intersectionSnap) {
                  snapInfo = intersectionSnap;
                }
              }
            }
          }

          // If no intersection found, use the guideline snap
          if (!snapInfo) {
            snapInfo = guidelineSnapInfo;
          }
        } else {
          // Snapping to something else - check if it's a line that intersects with extended guideline
          const tempSnapInfo = this.getSnapInfo(lngLat);
          if (tempSnapInfo && tempSnapInfo.type === "line") {
            // It's a line - check for intersection with extended guideline
            const intersectionSnap = findExtendedGuidelineIntersection(
              state.extendedGuidelines,
              tempSnapInfo,
              lngLat,
              state.snapTolerance,
            );
            if (intersectionSnap) {
              snapInfo = intersectionSnap;
            }
            // else: line but no intersection near cursor - snapInfo stays null
          }
          // else: not a line (it's a point) - snapInfo stays null
        }
      }
      // else: not snapping to anything - snapInfo stays null
    }
  } else {
    // No extended guidelines - use regular snapping
    snapInfo = this.getSnapInfo(lngLat);
  }

  // Calculate mouse bearing for orthogonal snap check
  const mouseBearing = turf.bearing(from, turf.point([lngLat.lng, lngLat.lat]));

  // Check for closing perpendicular snap (perpendicular to first segment)
  let closingPerpendicularSnap = null;
  if (state.vertices.length >= 2) {
    const firstVertex = state.vertices[0];
    const secondVertex = state.vertices[1];
    const firstSegmentBearing = turf.bearing(
      turf.point(firstVertex),
      turf.point(secondVertex),
    );
    const bearingToFirst = turf.bearing(
      turf.point([lngLat.lng, lngLat.lat]),
      turf.point(firstVertex),
    );

    // Check if bearing to first vertex is perpendicular to first segment (90° or 270°)
    for (const angle of [90, 270]) {
      const targetBearing = firstSegmentBearing + angle;
      const normalizedTarget = ((targetBearing % 360) + 360) % 360;
      const normalizedToFirst = ((bearingToFirst % 360) + 360) % 360;

      let diff = Math.abs(normalizedTarget - normalizedToFirst);
      if (diff > 180) diff = 360 - diff;

      if (diff <= 5) {
        closingPerpendicularSnap = {
          firstVertex: firstVertex,
          perpendicularBearing: targetBearing,
          firstSegmentBearing: firstSegmentBearing,
        };
        break;
      }
    }
  }

  // Check orthogonal snapping - either to previous segment OR to extended guidelines
  const extendedGuidelinesActive =
    state.extendedGuidelines && state.extendedGuidelines.length > 0;

  let orthogonalMatch = null;
  let isPerpendicularToGuideline = false;

  if (extendedGuidelinesActive && state.vertices.length >= 1) {
    // When extended guidelines are active, check for orthogonal (perpendicular/parallel) to guideline bearings
    const guidelineBearings = getExtendedGuidelineBearings(state.extendedGuidelines);
    orthogonalMatch = getPerpendicularToGuidelineBearing(
      guidelineBearings,
      mouseBearing,
      this._ctx.options.orthogonalSnapTolerance
    );
    if (orthogonalMatch) {
      isPerpendicularToGuideline = true;
    }
  } else if (!extendedGuidelinesActive) {
    // Regular orthogonal snapping to previous segment or snapped line
    orthogonalMatch = this.getOrthogonalBearing(
      state,
      mouseBearing,
      this._ctx.options.orthogonalSnapTolerance
    );
  }

  // Detect parallel lines nearby (orthogonal intersection method, configurable tolerance)
  // findNearbyParallelLines has internal caching, so we always call it but it returns cached results when appropriate
  let parallelLineMatch = null;
  if (!extendedGuidelinesActive && state.vertices.length >= 1) {
    const nearbyLines = findNearbyParallelLines(
      this._ctx,
      this.map,
      lastVertex,
      lngLat,
    );
    parallelLineMatch = getParallelBearing(
      nearbyLines,
      mouseBearing,
      this._ctx.options.parallelSnapTolerance,
    );
  }

  // Check for perpendicular-to-line snap (when snapping to a line)
  let perpendicularToLineSnap = null;
  if (
    !extendedGuidelinesActive &&
    state.vertices.length >= 1 &&
    snapInfo &&
    snapInfo.type === "line"
  ) {
    const perpPoint = calculatePerpendicularToLine(
      lastVertex,
      snapInfo.segment,
      lngLat,
    );
    if (perpPoint) {
      perpendicularToLineSnap = {
        coord: perpPoint.coord,
        distanceFromCursor: perpPoint.distanceFromCursor,
        lineSegment: snapInfo.segment,
        lineBearing: snapInfo.bearing,
      };
    }
  }

  // Check if BOTH regular orthogonal AND closing perpendicular are active
  const bothSnapsActive =
    !extendedGuidelinesActive &&
    orthogonalMatch !== null &&
    closingPerpendicularSnap !== null &&
    !(snapInfo && snapInfo.type === "point");

  // Resolve conflicts between orthogonal, parallel, and bothSnapsActive snapping
  const resolved = resolveSnapConflicts({
    orthogonalMatch,
    parallelLineMatch,
    bothSnapsActive,
    lastVertex,
    lngLat,
    closingPerpendicularSnap,
    proximityThreshold: this._ctx.options.parallelSnapProximityThreshold,
    mouseBearing,
  });
  orthogonalMatch = resolved.orthogonalMatch;
  parallelLineMatch = resolved.parallelLineMatch;

  // Check if perpendicular-to-line snap should override regular line snap
  // This happens when cursor is close to the perpendicular point (within snap tolerance)
  const snapTolerance = this._ctx.options.snapDistance || 20; // pixels
  const metersPerPixel =
    (156543.03392 * Math.cos((lngLat.lat * Math.PI) / 180)) /
    Math.pow(2, this.map.getZoom());
  const snapToleranceMeters = snapTolerance * metersPerPixel;

  let isPerpendicularToLineSnap = false;
  if (
    perpendicularToLineSnap &&
    perpendicularToLineSnap.distanceFromCursor <= snapToleranceMeters
  ) {
    // Within snap tolerance - check if perpendicular snap should win based on proximity
    // Compare with orthogonal and parallel snaps
    let shouldUsePerpendicular = true;

    if (orthogonalMatch !== null) {
      // Calculate distance to orthogonal snap point
      const orthogonalPoint = turf.destination(
        from,
        0.1,
        orthogonalMatch.bearing,
        { units: "kilometers" },
      );
      const orthogonalDist = turf.distance(
        turf.point([lngLat.lng, lngLat.lat]),
        orthogonalPoint,
        { units: "meters" },
      );
      if (orthogonalDist < perpendicularToLineSnap.distanceFromCursor) {
        shouldUsePerpendicular = false;
      }
    }

    if (shouldUsePerpendicular && parallelLineMatch !== null) {
      // Calculate distance to parallel snap point
      const parallelPoint = turf.destination(
        from,
        0.1,
        parallelLineMatch.bearing,
        { units: "kilometers" },
      );
      const parallelDist = turf.distance(
        turf.point([lngLat.lng, lngLat.lat]),
        parallelPoint,
        { units: "meters" },
      );
      if (parallelDist < perpendicularToLineSnap.distanceFromCursor) {
        shouldUsePerpendicular = false;
      }
    }

    if (shouldUsePerpendicular) {
      // Override snapInfo to use perpendicular point as a point snap
      snapInfo = {
        type: "point",
        coord: perpendicularToLineSnap.coord,
        snappedFeature: snapInfo.snappedFeature,
      };
      isPerpendicularToLineSnap = true;
      // Clear orthogonal and parallel snaps since perpendicular won
      orthogonalMatch = null;
      parallelLineMatch = null;
    }
  }

  // Store perpendicular-to-line snap state for indicator
  state.perpendicularToLineSnap = isPerpendicularToLineSnap
    ? perpendicularToLineSnap
    : null;

  // Determine reference bearing for angle input
  let referenceBearing = 0; // Default to true north
  if (state.vertices.length >= 2) {
    const secondLastVertex = state.vertices[state.vertices.length - 2];
    referenceBearing = turf.bearing(turf.point(secondLastVertex), from);
  } else if (state.snappedLineBearing !== null) {
    referenceBearing = state.snappedLineBearing;
  }

  // Determine direction (bearing) priority
  let bearingToUse = mouseBearing;
  let usePointDirection = false;
  let isOrthogonalSnap = false;
  let isClosingPerpendicularSnap = false;
  let isParallelLineSnap = false;
  const hasUserAngle =
    state.currentAngle !== null && !isNaN(state.currentAngle);

  // Show/hide angle reference line based on whether angle input is active
  if (hasUserAngle) {
    this.showAngleReferenceLine(state, lastVertex, referenceBearing);
  } else {
    this.removeAngleReferenceLine();
  }

  if (hasUserAngle) {
    // Priority 0: User-entered angle (highest priority for direction)
    bearingToUse = referenceBearing + state.currentAngle;
  } else if (snapInfo && snapInfo.type === "point") {
    // Priority 1: Point snap direction
    bearingToUse = turf.bearing(from, turf.point(snapInfo.coord));
    usePointDirection = true;
  } else if (snapInfo && snapInfo.type === "line") {
    // Priority 2: Line snap bearing - takes priority over bearing-based snaps
    bearingToUse = snapInfo.bearing;
  } else if (bothSnapsActive) {
    // Priority 3: Both orthogonal and closing perpendicular are active (only when no concrete snap)
    isOrthogonalSnap = true;
    isClosingPerpendicularSnap = true;
  } else if (orthogonalMatch !== null && (!extendedGuidelinesActive || isPerpendicularToGuideline)) {
    // Priority 4: Bearing snap (orthogonal/parallel to previous segment, snapped line, or extended guideline)
    // Only activates when no concrete snap target nearby
    bearingToUse = orthogonalMatch.bearing;
    isOrthogonalSnap = true;
  } else if (parallelLineMatch !== null && !extendedGuidelinesActive) {
    // Priority 5: Parallel line snap (snap to bearing of nearby lines)
    // Only activates when no concrete snap target nearby
    bearingToUse = parallelLineMatch.bearing;
    isParallelLineSnap = true;
    state.parallelLineSnap = parallelLineMatch;
  } else if (closingPerpendicularSnap !== null && !extendedGuidelinesActive) {
    // Priority 6: Closing perpendicular snap
    // Only activates when no concrete snap target nearby
    isClosingPerpendicularSnap = true;
  }

  // Clear parallel line snap if not active
  if (!isParallelLineSnap) {
    state.parallelLineSnap = null;
  }

  // Determine length priority
  if (hasUserDistance) {
    // Priority 1 for length: User-entered distance
    // If we have a line snap, use circle-line intersection to find the correct point
    if (snapInfo && snapInfo.type === "line") {
      const circleLineIntersection = calculateCircleLineIntersection(
        lastVertex,
        state.currentDistance,
        snapInfo.segment,
        [lngLat.lng, lngLat.lat],
      );
      if (circleLineIntersection) {
        previewVertex = circleLineIntersection.coord;
      } else {
        // Fallback: if no intersection found, use bearing to create point at exact distance
        const destinationPoint = turf.destination(
          from,
          state.currentDistance / 1000,
          bearingToUse,
          { units: "kilometers" },
        );
        previewVertex = destinationPoint.geometry.coordinates;
      }
    } else {
      // No line snap: use bearing to create point at exact distance
      const destinationPoint = turf.destination(
        from,
        state.currentDistance / 1000,
        bearingToUse,
        { units: "kilometers" },
      );
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.updateGuideCircle(state, lastVertex, state.currentDistance);
  } else if (bothSnapsActive) {
    // Special case: Both orthogonal and closing perpendicular are active
    // Find intersection where both constraints are satisfied
    const perpLine = {
      start: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing + 180,
        { units: "kilometers" },
      ).geometry.coordinates,
      end: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing,
        { units: "kilometers" },
      ).geometry.coordinates,
    };

    const intersection = calculateLineIntersection(
      lastVertex,
      orthogonalMatch.bearing,
      perpLine,
    );
    if (intersection) {
      previewVertex = intersection.coord;
      // Show both indicators (regular at last vertex, closing at first vertex)
      this.updateRightAngleIndicator(
        state,
        lastVertex,
        orthogonalMatch.referenceBearing,
        orthogonalMatch.bearing,
        orthogonalMatch.referenceSegment,
      );
      const closingBearing = turf.bearing(
        turf.point(previewVertex),
        turf.point(closingPerpendicularSnap.firstVertex),
      );
      const firstSegment = { start: state.vertices[0], end: state.vertices[1] };
      this.updateClosingRightAngleIndicator(
        state,
        closingPerpendicularSnap.firstVertex,
        closingPerpendicularSnap.firstSegmentBearing,
        closingBearing,
        firstSegment,
      );
    } else {
      // Fallback to mouse distance
      const mouseDistance = turf.distance(
        from,
        turf.point([lngLat.lng, lngLat.lat]),
        { units: "kilometers" },
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        orthogonalMatch.bearing,
        { units: "kilometers" },
      );
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.removeGuideCircle(state);
  } else if (
    closingPerpendicularSnap !== null &&
    !usePointDirection &&
    !isOrthogonalSnap &&
    !snapInfo
  ) {
    // Closing perpendicular snap: find intersection where closing segment is perpendicular to first segment
    // Only activates when no concrete snap target nearby
    const perpLine = {
      start: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing + 180,
        { units: "kilometers" },
      ).geometry.coordinates,
      end: turf.destination(
        turf.point(closingPerpendicularSnap.firstVertex),
        0.1,
        closingPerpendicularSnap.perpendicularBearing,
        { units: "kilometers" },
      ).geometry.coordinates,
    };

    const intersection = calculateLineIntersection(
      lastVertex,
      mouseBearing,
      perpLine,
    );
    if (intersection) {
      previewVertex = intersection.coord;
      const closingBearing = turf.bearing(
        turf.point(previewVertex),
        turf.point(closingPerpendicularSnap.firstVertex),
      );
      const firstSegment = { start: state.vertices[0], end: state.vertices[1] };
      this.updateClosingRightAngleIndicator(
        state,
        closingPerpendicularSnap.firstVertex,
        closingPerpendicularSnap.firstSegmentBearing,
        closingBearing,
        firstSegment,
      );
    } else {
      // Fallback to mouse position
      const mouseDistance = turf.distance(
        from,
        turf.point([lngLat.lng, lngLat.lat]),
        { units: "kilometers" },
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        mouseBearing,
        { units: "kilometers" },
      );
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.removeGuideCircle(state);
  } else if (usePointDirection && snapInfo) {
    // Point snap: use distance to point
    previewVertex = snapInfo.coord;
    this.removeGuideCircle(state);
  } else if (snapInfo && snapInfo.type === "line") {
    // Line snap: use snapped position
    previewVertex = snapInfo.coord;
    this.removeGuideCircle(state);
  } else {
    // No snap: use mouse distance with bearing
    const mouseDistance = turf.distance(
      from,
      turf.point([lngLat.lng, lngLat.lat]),
      { units: "kilometers" },
    );
    const destinationPoint = turf.destination(
      from,
      mouseDistance,
      bearingToUse,
      { units: "kilometers" },
    );
    previewVertex = destinationPoint.geometry.coordinates;
    this.removeGuideCircle(state);
  }

  // Show right-angle indicator if orthogonal snap is active (but not for point snap or dual snap)
  if (isPerpendicularToLineSnap && state.perpendicularToLineSnap) {
    // Show right angle indicator at the perpendicular point
    const perpSnap = state.perpendicularToLineSnap;
    const snapPoint = turf.point(perpSnap.coord);

    // Calculate bearing from last vertex to perpendicular point
    const bearingToPerp = turf.bearing(turf.point(lastVertex), snapPoint);

    // The indicator should always be on the side of the snapping line where the last vertex is
    // Use cross product to determine which side: (snapPoint - lineStart) × (lastVertex - lineStart)
    const lineStart = turf.point(perpSnap.lineSegment.start);
    const lineEnd = turf.point(perpSnap.lineSegment.end);
    const lastVertPoint = turf.point(lastVertex);

    // Vectors from line start
    const toSnap = [
      perpSnap.coord[0] - lineStart.geometry.coordinates[0],
      perpSnap.coord[1] - lineStart.geometry.coordinates[1],
    ];
    const toLastVert = [
      lastVertPoint.geometry.coordinates[0] - lineStart.geometry.coordinates[0],
      lastVertPoint.geometry.coordinates[1] - lineStart.geometry.coordinates[1],
    ];

    // Cross product: toSnap × toLastVert
    const crossProduct = toSnap[0] * toLastVert[1] - toSnap[1] * toLastVert[0];

    // If cross product is positive, lastVertex is on the left side of the vector from lineStart to snapPoint
    // If negative, lastVertex is on the right side
    // We want flipInside = false when lastVertex is on the left, true when on the right
    const flipInside = crossProduct < 0;

    this.updateRightAngleIndicator(
      state,
      perpSnap.coord,
      perpSnap.lineBearing,
      bearingToPerp,
      perpSnap.lineSegment,
      flipInside,
    );
  } else if (
    isOrthogonalSnap &&
    !usePointDirection &&
    !bothSnapsActive &&
    !isClosingPerpendicularSnap &&
    orthogonalMatch
  ) {
    // Check if this is a collinear snap (0° or 180°) or a perpendicular snap (90° or 270°)
    const isCollinear = orthogonalMatch.angleFromReference === 0 || orthogonalMatch.angleFromReference === 180;
    if (isCollinear) {
      // Show collinear snap line instead of right-angle indicator
      this.updateCollinearSnapLine(
        state,
        lastVertex,
        previewVertex,
        orthogonalMatch.referenceBearing
      );
      this.removeRightAngleIndicator(state);
    } else {
      // Show right-angle indicator for perpendicular snaps
      this.updateRightAngleIndicator(
        state,
        lastVertex,
        orthogonalMatch.referenceBearing,
        bearingToUse,
        orthogonalMatch.referenceSegment,
      );
      this.removeCollinearSnapLine(state);
    }
  } else {
    this.removeRightAngleIndicator(state);
    this.removeCollinearSnapLine(state);
  }

  // Clean up closing indicator if not in use
  if (!isClosingPerpendicularSnap && !bothSnapsActive) {
    this.removeClosingRightAngleIndicator(state);
  }

  // Show parallel line indicators
  if (isParallelLineSnap && state.parallelLineSnap) {
    this.updateParallelLineIndicators(
      state,
      lastVertex,
      previewVertex,
      state.parallelLineSnap.matchedLine,
    );
  } else {
    this.removeParallelLineIndicators(state);
  }

  // Calculate actual distance to preview vertex (accounts for all snapping)
  const actualDistance = turf.distance(from, turf.point(previewVertex), {
    units: "meters",
  });

  // Update distance label
  this.updateDistanceLabel(state, lastVertex, previewVertex, actualDistance);

  // Check if we're snapping to an extended guideline
  const isSnappingToExtendedGuideline =
    snapInfo &&
    snapInfo.type === "line" &&
    snapInfo.snappedFeature &&
    snapInfo.snappedFeature.properties &&
    snapInfo.snappedFeature.properties.isExtendedGuideline;

  // Update line segment split labels if snapping to a line (but not extended guidelines)
  if (snapInfo && snapInfo.type === "line" && !isSnappingToExtendedGuideline) {
    this.updateLineSegmentSplitLabels(state, snapInfo.segment, previewVertex);
  } else if (snapInfo && snapInfo.type === "point") {
    // Check for underlying line at the point snap location
    const underlyingLineInfo = getUnderlyingLineBearing(
      this._ctx,
      this.map,
      e,
      { lng: snapInfo.coord[0], lat: snapInfo.coord[1] },
    );
    if (underlyingLineInfo && underlyingLineInfo.segment) {
      this.updateLineSegmentSplitLabels(
        state,
        underlyingLineInfo.segment,
        snapInfo.coord,
      );
    } else {
      this.removeLineSegmentSplitLabels(state);
    }
  } else {
    this.removeLineSegmentSplitLabels(state);
  }

  // Show distance to first intersection in drawing direction (always active when drawing)
  // This is an expensive operation - throttle it
  if (state.vertices.length >= 1 && shouldRunHeavyCompute) {
    // Calculate the drawing bearing from last vertex to preview vertex
    const drawingBearing = turf.bearing(
      turf.point(lastVertex),
      turf.point(previewVertex)
    );

    // Find the first intersection in the drawing direction
    const intersection = this.findFirstIntersectionInDirection(
      state,
      previewVertex,
      drawingBearing,
      0.5 // Search up to 500m ahead
    );

    if (intersection) {
      this.updateGuidelineIntersectionDistanceLabel(
        state,
        previewVertex,
        intersection.coord,
        intersection.distance
      );
    } else {
      this.removeGuidelineIntersectionDistanceLabel(state);
    }
  } else if (state.vertices.length === 0) {
    this.removeGuidelineIntersectionDistanceLabel(state);
  }

  // Store preview vertex in state so it can be used in clickOnMap
  state.previewVertex = previewVertex;

  // Show preview point when snapping to something OR when orthogonal/parallel snap is active
  if (snapInfo || isOrthogonalSnap || isParallelLineSnap) {
    this.updatePreviewPoint(state, previewVertex);
  } else {
    this.removePreviewPoint(state);
  }

  // Update polygon preview
  const allCoords = [...state.vertices, previewVertex];
  if (state.drawingSubMode !== DRAWING_SUB_MODES.LINE) {
    allCoords.push(state.vertices[0]); // Close the polygon ring
  }
  state.polygon.setCoordinates([allCoords]);
};

DrawPolygonDistance.updateDistanceLabel = function (
  state,
  startVertex,
  endVertex,
  distance,
) {
  const map = this.map;
  if (!map) return;

  // Format distance to 1 decimal place
  const distanceText = `${distance.toFixed(1)}m`;

  // Calculate midpoint of the segment
  const start = turf.point(startVertex);
  const end = turf.point(endVertex);
  const midpoint = turf.midpoint(start, end);

  // Calculate bearing for rotation
  const bearing = turf.bearing(start, end);

  // Calculate text rotation (perpendicular to line)
  let rotation = bearing - 90;
  // Normalize to 0-360
  rotation = ((rotation % 360) + 360) % 360;
  // If upside down (between 90° and 270°), flip it 180°
  if (rotation > 90 && rotation < 270) {
    rotation = (rotation + 180) % 360;
  }

  // Offset the label position above the line (perpendicular to bearing)
  // Use 3m offset above the line (increased from 1.5m to ensure it's clearly above)
  const offsetDistance = 3 / 1000; // Convert to km for turf
  const perpendicularBearing = bearing - 90; // 90 degrees perpendicular to the LEFT (above when rotated)
  const offsetMidpoint = turf.destination(
    midpoint,
    offsetDistance,
    perpendicularBearing,
    { units: "kilometers" },
  );

  // Create a feature for the text label at the offset midpoint
  const labelFeature = {
    type: "Feature",
    properties: {
      distanceLabel: true,
      distance: distanceText,
      rotation: rotation,
    },
    geometry: {
      type: "Point",
      coordinates: offsetMidpoint.geometry.coordinates,
    },
  };

  // Wrap in FeatureCollection to ensure proper rendering
  const labelFeatureCollection = {
    type: "FeatureCollection",
    features: [labelFeature],
  };

  // Update or create the text label layer
  if (!map.getSource("distance-label-text")) {
    map.addSource("distance-label-text", {
      type: "geojson",
      data: labelFeatureCollection,
    });

    map.addLayer({
      id: "distance-label-text",
      type: "symbol",
      source: "distance-label-text",
      layout: {
        "text-field": ["get", "distance"],
        "text-size": 10,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0],
        "text-anchor": "center",
        "text-rotate": ["get", "rotation"],
        "text-rotation-alignment": "map",
        "text-pitch-alignment": "map",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#000000",
        "text-opacity": 1,
      },
    });
  } else {
    map.getSource("distance-label-text").setData(labelFeatureCollection);
  }
};

DrawPolygonDistance.removeDistanceLabel = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("distance-label-text")) {
    map.removeLayer("distance-label-text");
  }
  if (map.getSource && map.getSource("distance-label-text")) {
    map.removeSource("distance-label-text");
  }
};

// Cache for intersection search results - reduces expensive queries
let intersectionCache = {
  key: null,
  result: null,
  timestamp: 0
};
const INTERSECTION_CACHE_TTL = 50; // Cache valid for 50ms
const UNITS_METERS = { units: "meters" };
const UNITS_KM = { units: "kilometers" };

/**
 * Find the first intersection between a ray (from previewVertex in drawingBearing direction)
 * and any snap layer features.
 * OPTIMIZED: Uses bbox-based querying and caching to reduce expensive operations.
 * @param {Array} previewVertex - Current preview vertex [lng, lat]
 * @param {number} drawingBearing - Bearing of the drawing direction
 * @param {number} maxDistance - Maximum distance to search (in km)
 * @returns {Object|null} - {coord, distance, feature} or null if no intersection found
 */
DrawPolygonDistance.findFirstIntersectionInDirection = function (
  state,
  previewVertex,
  drawingBearing,
  maxDistance = 0.5
) {
  const map = this.map;
  if (!map) return null;

  // Create cache key from position and bearing (rounded)
  const cacheKey = `${previewVertex[0].toFixed(6)},${previewVertex[1].toFixed(6)}-${Math.round(drawingBearing)}`;

  // Check cache
  const now = Date.now();
  if (intersectionCache.key === cacheKey && (now - intersectionCache.timestamp) < INTERSECTION_CACHE_TTL) {
    return intersectionCache.result;
  }

  // Create a ray from previewVertex in the drawing direction
  const startPoint = turf.point(previewVertex);
  const endPoint = turf.destination(startPoint, maxDistance, drawingBearing, UNITS_KM);
  const endCoords = endPoint.geometry.coordinates;

  const rayLine = turf.lineString([previewVertex, endCoords]);

  // Get snap buffer layers (these are queryable even when original layers have 0 opacity)
  const snapping = this._ctx.snapping;
  if (!snapping || !snapping.bufferLayers || snapping.bufferLayers.length === 0) return null;

  // Calculate bbox for the ray to limit query area
  const minLng = Math.min(previewVertex[0], endCoords[0]);
  const maxLng = Math.max(previewVertex[0], endCoords[0]);
  const minLat = Math.min(previewVertex[1], endCoords[1]);
  const maxLat = Math.max(previewVertex[1], endCoords[1]);

  // Convert bbox to screen coordinates
  const sw = map.project([minLng, minLat]);
  const ne = map.project([maxLng, maxLat]);

  let closestIntersection = null;
  let closestDistance = Infinity;

  // Query features from snap buffer layers - use cached layer IDs if available
  if (!state._cachedBufferLayerIds || state._bufferLayerIdsCacheTime < now - 5000) {
    state._cachedBufferLayerIds = snapping.bufferLayers.map(
      (layerId) => "_snap_buffer_" + layerId
    );
    state._bufferLayerIdsCacheTime = now;
  }
  const layerIds = state._cachedBufferLayerIds;

  // Query with bbox constraint
  const allFeatures = map.queryRenderedFeatures(
    [[sw.x, ne.y], [ne.x, sw.y]],
    { layers: layerIds.filter(id => map.getLayer(id)) }
  );

  for (const feature of allFeatures) {
    let lineToIntersect = null;

    if (feature.geometry.type === "LineString") {
      lineToIntersect = feature;
    } else if (feature.geometry.type === "Polygon") {
      lineToIntersect = turf.polygonToLine(feature);
    } else if (feature.geometry.type === "MultiLineString") {
      for (const coords of feature.geometry.coordinates) {
        const line = turf.lineString(coords);
        const intersections = turf.lineIntersect(rayLine, line);
        if (intersections.features.length > 0) {
          for (const intersection of intersections.features) {
            const dist = turf.distance(startPoint, intersection, UNITS_METERS);
            if (dist > 0.1 && dist < closestDistance) {
              closestDistance = dist;
              closestIntersection = {
                coord: intersection.geometry.coordinates,
                distance: dist,
                feature: feature,
              };
            }
          }
        }
      }
      continue;
    } else {
      continue;
    }

    if (lineToIntersect) {
      const intersections = turf.lineIntersect(rayLine, lineToIntersect);
      if (intersections.features.length > 0) {
        for (const intersection of intersections.features) {
          const dist = turf.distance(startPoint, intersection, UNITS_METERS);
          if (dist > 0.1 && dist < closestDistance) {
            closestDistance = dist;
            closestIntersection = {
              coord: intersection.geometry.coordinates,
              distance: dist,
              feature: feature,
            };
          }
        }
      }
    }
  }

  // Update cache
  intersectionCache = { key: cacheKey, result: closestIntersection, timestamp: now };

  return closestIntersection;
};

/**
 * Show distance label from preview vertex to the first intersection in drawing direction
 */
DrawPolygonDistance.updateGuidelineIntersectionDistanceLabel = function (
  state,
  previewVertex,
  intersectionCoord,
  distance
) {
  const map = this.map;
  if (!map) return;

  // Format distance
  const distanceText = `${distance.toFixed(1)}m`;

  // Calculate midpoint between preview vertex and intersection
  const start = turf.point(previewVertex);
  const end = turf.point(intersectionCoord);
  const midpoint = turf.midpoint(start, end);

  // Calculate bearing for rotation
  const bearing = turf.bearing(start, end);

  // Calculate text rotation (perpendicular to line, consistent with segment length label)
  let rotation = bearing - 90;
  // Normalize to 0-360
  rotation = ((rotation % 360) + 360) % 360;
  // If upside down (between 90° and 270°), flip it 180°
  if (rotation > 90 && rotation < 270) {
    rotation = (rotation + 180) % 360;
  }

  // Offset the label position to the side of the line
  const offsetDistance = 3 / 1000; // 3m in km
  const perpendicularBearing = bearing - 90;
  const offsetMidpoint = turf.destination(
    midpoint,
    offsetDistance,
    perpendicularBearing,
    { units: "kilometers" }
  );

  // Create label feature
  const labelFeature = {
    type: "Feature",
    properties: {
      guidelineDistanceLabel: true,
      distance: distanceText,
      rotation: rotation,
    },
    geometry: {
      type: "Point",
      coordinates: offsetMidpoint.geometry.coordinates,
    },
  };

  // Create line feature to show the distance visually
  const lineFeature = {
    type: "Feature",
    properties: {
      guidelineDistanceLine: true,
    },
    geometry: {
      type: "LineString",
      coordinates: [previewVertex, intersectionCoord],
    },
  };

  const featureCollection = {
    type: "FeatureCollection",
    features: [labelFeature, lineFeature],
  };

  // Update or create the layer
  if (!map.getSource("guideline-intersection-distance")) {
    map.addSource("guideline-intersection-distance", {
      type: "geojson",
      data: featureCollection,
    });

    // Add line layer
    map.addLayer({
      id: "guideline-intersection-distance-line",
      type: "line",
      source: "guideline-intersection-distance",
      filter: ["==", ["get", "guidelineDistanceLine"], true],
      paint: {
        "line-color": "#666666",
        "line-width": 1,
        "line-dasharray": [4, 4],
        "line-opacity": 0.7,
      },
    });

    // Add text label layer
    map.addLayer({
      id: "guideline-intersection-distance-label",
      type: "symbol",
      source: "guideline-intersection-distance",
      filter: ["==", ["get", "guidelineDistanceLabel"], true],
      layout: {
        "text-field": ["get", "distance"],
        "text-size": 10,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0],
        "text-anchor": "center",
        "text-rotate": ["get", "rotation"],
        "text-rotation-alignment": "map",
        "text-pitch-alignment": "map",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#666666",
        "text-opacity": 1,
      },
    });
  } else {
    map.getSource("guideline-intersection-distance").setData(featureCollection);
  }
};

/**
 * Remove the guideline intersection distance label
 */
DrawPolygonDistance.removeGuidelineIntersectionDistanceLabel = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("guideline-intersection-distance-label")) {
    map.removeLayer("guideline-intersection-distance-label");
  }
  if (map.getLayer && map.getLayer("guideline-intersection-distance-line")) {
    map.removeLayer("guideline-intersection-distance-line");
  }
  if (map.getSource && map.getSource("guideline-intersection-distance")) {
    map.removeSource("guideline-intersection-distance");
  }
};

DrawPolygonDistance.updateLineSegmentSplitLabels = function (
  state,
  segment,
  snapPoint,
) {
  const map = this.map;
  if (!map) return;

  const snappedCoord = this._ctx.snapping.snapCoord({
    lng: snapPoint[0],
    lat: snapPoint[1],
  });
  const snapCoord = [snappedCoord.lng, snappedCoord.lat];

  // Calculate distances for the two sub-segments
  const distance1 = turf.distance(
    turf.point(segment.start),
    turf.point(snapCoord),
    { units: "meters" },
  );
  const distance2 = turf.distance(
    turf.point(snapCoord),
    turf.point(segment.end),
    { units: "meters" },
  );

  const labelFeatures = [];

  // First sub-segment label (start to snap point)
  if (distance1 > 0.1) {
    // Only show if distance is meaningful
    const distanceText1 = `${distance1.toFixed(1)}m`;
    const midpoint1 = turf.midpoint(
      turf.point(segment.start),
      turf.point(snapCoord),
    );
    const bearing1 = turf.bearing(
      turf.point(segment.start),
      turf.point(snapCoord),
    );

    // Calculate rotation and flip if upside down
    let rotation1 = bearing1 - 90;
    rotation1 = ((rotation1 % 360) + 360) % 360;
    if (rotation1 > 90 && rotation1 < 270) {
      rotation1 = (rotation1 + 180) % 360;
    }

    const offsetDistance = 3 / 1000;
    const perpendicularBearing1 = bearing1 - 90;
    const offsetMidpoint1 = turf.destination(
      midpoint1,
      offsetDistance,
      perpendicularBearing1,
      { units: "kilometers" },
    );

    labelFeatures.push({
      type: "Feature",
      properties: {
        distanceLabel: true,
        distance: distanceText1,
        rotation: rotation1,
      },
      geometry: {
        type: "Point",
        coordinates: offsetMidpoint1.geometry.coordinates,
      },
    });
  }

  // Second sub-segment label (snap point to end)
  if (distance2 > 0.1) {
    // Only show if distance is meaningful
    const distanceText2 = `${distance2.toFixed(1)}m`;
    const midpoint2 = turf.midpoint(
      turf.point(snapCoord),
      turf.point(segment.end),
    );
    const bearing2 = turf.bearing(
      turf.point(snapCoord),
      turf.point(segment.end),
    );

    // Calculate rotation and flip if upside down
    let rotation2 = bearing2 - 90;
    rotation2 = ((rotation2 % 360) + 360) % 360;
    if (rotation2 > 90 && rotation2 < 270) {
      rotation2 = (rotation2 + 180) % 360;
    }

    const offsetDistance = 3 / 1000;
    const perpendicularBearing2 = bearing2 - 90;
    const offsetMidpoint2 = turf.destination(
      midpoint2,
      offsetDistance,
      perpendicularBearing2,
      { units: "kilometers" },
    );

    labelFeatures.push({
      type: "Feature",
      properties: {
        distanceLabel: true,
        distance: distanceText2,
        rotation: rotation2,
      },
      geometry: {
        type: "Point",
        coordinates: offsetMidpoint2.geometry.coordinates,
      },
    });
  }

  const labelFeatureCollection = {
    type: "FeatureCollection",
    features: labelFeatures,
  };

  if (!map.getSource("line-segment-split-labels")) {
    map.addSource("line-segment-split-labels", {
      type: "geojson",
      data: labelFeatureCollection,
    });

    map.addLayer({
      id: "line-segment-split-labels",
      type: "symbol",
      source: "line-segment-split-labels",
      layout: {
        "text-field": ["get", "distance"],
        "text-size": 10,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0],
        "text-anchor": "center",
        "text-rotate": ["get", "rotation"],
        "text-rotation-alignment": "map",
        "text-pitch-alignment": "map",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#666666",
        "text-opacity": 0.8,
      },
    });
  } else {
    map.getSource("line-segment-split-labels").setData(labelFeatureCollection);
  }
};

DrawPolygonDistance.removeLineSegmentSplitLabels = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("line-segment-split-labels")) {
    map.removeLayer("line-segment-split-labels");
  }
  if (map.getSource && map.getSource("line-segment-split-labels")) {
    map.removeSource("line-segment-split-labels");
  }
};

DrawPolygonDistance.updatePreviewPoint = function (state, coordinates) {
  const map = this.map;
  if (!map) return;

  const previewPointFeature = {
    type: "Feature",
    properties: { isPreviewPoint: true },
    geometry: {
      type: "Point",
      coordinates: coordinates,
    },
  };

  if (!map.getSource("preview-point-indicator")) {
    map.addSource("preview-point-indicator", {
      type: "geojson",
      data: previewPointFeature,
    });

    map.addLayer({
      id: "preview-point-indicator",
      type: "circle",
      source: "preview-point-indicator",
      paint: {
        "circle-radius": 2,
        "circle-color": "#000000",
        "circle-opacity": 1,
      },
    });
  } else {
    map.getSource("preview-point-indicator").setData(previewPointFeature);
  }
};

DrawPolygonDistance.removePreviewPoint = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("preview-point-indicator")) {
    map.removeLayer("preview-point-indicator");
  }
  if (map.getSource && map.getSource("preview-point-indicator")) {
    map.removeSource("preview-point-indicator");
  }
};

DrawPolygonDistance.updateGuideCircle = function (state, center, radius) {
  // Check if we can reuse the existing circle (optimization)
  if (
    state.guideCircle &&
    state.guideCircleRadius === radius &&
    state.guideCircleCenter &&
    state.guideCircleCenter[0] === center[0] &&
    state.guideCircleCenter[1] === center[1]
  ) {
    return; // No need to regenerate
  }

  const steps = 64;
  const circleCoords = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 360;
    const pt = turf.destination(turf.point(center), radius / 1000, angle, {
      units: "kilometers",
    });
    circleCoords.push(pt.geometry.coordinates);
  }

  const circleFeature = {
    type: "Feature",
    properties: { isGuideCircle: true },
    geometry: {
      type: "LineString",
      coordinates: circleCoords,
    },
  };

  state.guideCircle = circleFeature;
  state.guideCircleRadius = radius;
  state.guideCircleCenter = center;

  const map = this.map;
  if (!map) return;

  if (!map.getSource("distance-guide-circle")) {
    map.addSource("distance-guide-circle", {
      type: "geojson",
      data: circleFeature,
    });

    map.addLayer({
      id: "distance-guide-circle",
      type: "line",
      source: "distance-guide-circle",
      paint: {
        "line-color": "#000000",
        "line-width": 1,
        "line-opacity": 0.2,
        "line-dasharray": [2, 2],
      },
    });
  } else {
    map.getSource("distance-guide-circle").setData(circleFeature);
  }
};

DrawPolygonDistance.removeGuideCircle = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("distance-guide-circle")) {
    map.removeLayer("distance-guide-circle");
  }
  if (map.getSource && map.getSource("distance-guide-circle")) {
    map.removeSource("distance-guide-circle");
  }
  state.guideCircle = null;
};

DrawPolygonDistance.onKeyUp = function (state, e) {
  // Tab key
  if (e.keyCode === 9) {
    if (state.vertices.length === 0) return;

    if (!state.inputEnabled) {
      state.snapEnabled = true;
      state.inputEnabled = true;
      state.currentDistance = null;
      if (state.distanceInput) {
        state.distanceInput.value = "";
        state.distanceInput.style.display = "block";
        setTimeout(() => state.distanceInput.focus(), 10);
      }
      this.removeGuideCircle(state);
    }
    return;
  }

  // Enter key
  if (e.keyCode === 13 || CommonSelectors.isEnterKey(e)) {
    if (state.drawingSubMode === DRAWING_SUB_MODES.LINE) {
      if (state.linePhase === 'offset') {
        // Already in offset phase - ignore enter (click to confirm)
        return;
      }
      if (state.vertices.length >= 2) {
        this.enterLineOffsetPhase(state);
      }
    } else if (state.vertices.length >= 3) {
      this.finishDrawing(state);
    }
  }

  // Escape key
  if (e.keyCode === 27 || CommonSelectors.isEscapeKey(e)) {
    if (state.drawingSubMode === DRAWING_SUB_MODES.LINE && state.linePhase === 'offset') {
      // Cancel offset phase, go back to line drawing
      state.linePhase = 'drawing';
      this.removeDistanceLabel(state);
      this.removeGuideCircle(state);
      // Reset polygon to line preview
      const coords = [...state.vertices, state.vertices[0]];
      state.polygon.setCoordinates([coords]);
    } else if (state.vertices.length >= 3) {
      this.finishDrawing(state);
    } else {
      this.deleteFeature([state.polygon.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  }

  // Backspace
  if (e.keyCode === 8) {
    // Don't allow backspace during line offset phase
    if (state.drawingSubMode === DRAWING_SUB_MODES.LINE && state.linePhase === 'offset') {
      return;
    }
    // Don't delete vertex if user is typing in distance or angle input
    if (state.distanceInput && state.distanceInput.value !== "") {
      return;
    }
    if (state.angleInput && state.angleInput.value !== "") {
      return;
    }
    // Also check if either input is focused (even if empty)
    if (
      document.activeElement === state.distanceInput ||
      document.activeElement === state.angleInput
    ) {
      return;
    }

    if (state.vertices.length > 1) {
      state.vertices.pop();
      // In rectangle mode, reset polygon to just the remaining vertices
      if (state.drawingSubMode === DRAWING_SUB_MODES.RECTANGLE) {
        const coords = [...state.vertices, state.vertices[0]];
        state.polygon.setCoordinates([coords]);
      } else {
        state.polygon.removeCoordinate(`0.${state.vertices.length}`);
      }
    } else if (state.vertices.length === 1) {
      state.vertices.pop();
      state.polygon.setCoordinates([[]]);
      // Show mode selector again, hide distance/angle UI
      showDrawingModeSelector(state);
      hideDistanceAngleUI(state);
    }
  }
};

DrawPolygonDistance.handleRectanglePreview = function (state, e) {
  const v0 = state.vertices[0];
  const v1 = state.vertices[1];
  const lngLat = e.lngLat;

  const edgeBearing = turf.bearing(turf.point(v0), turf.point(v1));
  const mousePoint = turf.point([lngLat.lng, lngLat.lat]);

  // Project mouse onto perpendicular from the midpoint of the edge
  const edgeLine = turf.lineString([v0, v1]);
  const nearestOnEdge = turf.nearestPointOnLine(edgeLine, mousePoint);
  const perpDistance = turf.distance(nearestOnEdge, mousePoint, TURF_UNITS_KM);

  // Determine which side of the edge the mouse is on
  const crossProduct =
    (v1[0] - v0[0]) * (lngLat.lat - v0[1]) -
    (v1[1] - v0[1]) * (lngLat.lng - v0[0]);
  const side = crossProduct > 0 ? -1 : 1;
  const actualPerpBearing = edgeBearing + (side * 90);

  // Priority: distance input > snap > raw mouse
  let dist;
  if (state.currentDistance !== null && state.currentDistance > 0) {
    dist = state.currentDistance / 1000;
  } else {
    const snapped = this._ctx.snapping.snapCoord(lngLat);
    if (snapped.snapped) {
      const snappedPoint = turf.point([snapped.lng, snapped.lat]);
      const projOnEdge = turf.nearestPointOnLine(edgeLine, snappedPoint);
      const snapDist = turf.distance(projOnEdge, snappedPoint, TURF_UNITS_KM);
      const snapCross =
        (v1[0] - v0[0]) * (snapped.lat - v0[1]) -
        (v1[1] - v0[1]) * (snapped.lng - v0[0]);
      const snapSide = snapCross > 0 ? -1 : 1;
      dist = (snapSide === side && snapDist > 0) ? snapDist : perpDistance;
    } else {
      dist = perpDistance;
    }
  }

  // Calculate the rectangle corners
  const v2 = turf.destination(turf.point(v1), dist, actualPerpBearing, TURF_UNITS_KM).geometry.coordinates;
  const v3 = turf.destination(turf.point(v0), dist, actualPerpBearing, TURF_UNITS_KM).geometry.coordinates;

  state.previewVertex = v2;

  // Update polygon to show rectangle preview
  state.polygon.setCoordinates([[v0, v1, v2, v3, v0]]);

  // Update distance label showing perpendicular distance
  const perpDistanceMeters = dist * 1000;
  this.updateDistanceLabel(state, v1, v2, perpDistanceMeters);

  // Update guide circle if distance is set
  if (state.currentDistance !== null && state.currentDistance > 0) {
    this.updateGuideCircle(state, v1, state.currentDistance);
  } else {
    this.removeGuideCircle(state);
  }
};

DrawPolygonDistance.completeRectangle = function (state, perpendicularPoint) {
  const v0 = state.vertices[0];
  const v1 = state.vertices[1];

  // Use the current polygon coordinates which were already computed by handleRectanglePreview
  const currentCoords = state.polygon.coordinates[0];
  let v2, v3;

  if (currentCoords && currentCoords.length === 5) {
    // Polygon already has the rectangle preview (v0, v1, v2, v3, v0)
    v2 = currentCoords[2];
    v3 = currentCoords[3];
  } else {
    // Fallback: compute from the perpendicular point
    const edgeBearing = turf.bearing(turf.point(v0), turf.point(v1));
    const clickedPoint = turf.point(perpendicularPoint);
    const edgeLine = turf.lineString([v0, v1]);
    const nearestOnEdge = turf.nearestPointOnLine(edgeLine, clickedPoint);
    const perpDistance = turf.distance(nearestOnEdge, clickedPoint, TURF_UNITS_KM);

    const crossProduct =
      (v1[0] - v0[0]) * (perpendicularPoint[1] - v0[1]) -
      (v1[1] - v0[1]) * (perpendicularPoint[0] - v0[0]);
    const side = crossProduct > 0 ? -1 : 1;
    const actualPerpBearing = edgeBearing + (side * 90);

    v2 = turf.destination(turf.point(v1), perpDistance, actualPerpBearing, TURF_UNITS_KM).geometry.coordinates;
    v3 = turf.destination(turf.point(v0), perpDistance, actualPerpBearing, TURF_UNITS_KM).geometry.coordinates;
  }

  state.vertices = [v0, v1, v2, v3];
  state.polygon.setCoordinates([[v0, v1, v2, v3, v0]]);

  this.removeGuideCircle(state);
  this.removeRightAngleIndicator(state);
  this.removeLineSegmentSplitLabels(state);
  this.removePreviewPoint(state);
  this.removeCollinearSnapLine(state);
  this.removeDistanceLabel(state);

  this.fire(Constants.events.CREATE, {
    features: [state.polygon.toGeoJSON()],
  });

  this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.polygon.id],
  });
};

DrawPolygonDistance.enterLineOffsetPhase = function (state) {
  state.linePhase = 'offset';
  state.lineOffsetWidth = null;
  state.lineOffsetSide = null;
  state.previewVertex = null;

  // Clear and blur distance/angle inputs for the offset phase
  if (state.distanceInput) {
    state.distanceInput.value = '';
    state.distanceInput.blur();
    state.currentDistance = null;
    if (state.distanceUpdateDisplay) state.distanceUpdateDisplay();
  }
  if (state.angleInput) {
    state.angleInput.value = '';
    state.angleInput.blur();
    state.currentAngle = null;
    if (state.angleUpdateDisplay) state.angleUpdateDisplay();
  }

  this.removePreviewPoint(state);
  this.removeRightAngleIndicator(state);
  this.removeCollinearSnapLine(state);
  this.removeDistanceLabel(state);

  // Trigger immediate preview if we have a current mouse position
  if (state.currentPosition) {
    this.handleLineOffsetPreview(state, {
      lngLat: state.currentPosition,
      point: state.lastPoint || { x: 0, y: 0 },
    });
  }
};

DrawPolygonDistance.handleLineOffsetPreview = function (state, e) {
  const lngLat = e.lngLat;
  const mousePoint = turf.point([lngLat.lng, lngLat.lat]);

  // Compute perpendicular distance from the mouse to the polyline
  const polyline = turf.lineString(state.vertices);
  const nearestOnLine = turf.nearestPointOnLine(polyline, mousePoint);
  const perpDistanceKm = turf.distance(nearestOnLine, mousePoint, TURF_UNITS_KM);

  // Determine which side of the line the mouse is on
  // Use the overall line direction (start to end) as a consistent reference
  // This prevents side-flipping when mouse moves between differently-oriented segments
  const lineStart = state.vertices[0];
  const lineEnd = state.vertices[state.vertices.length - 1];
  const overallBearing = turf.bearing(turf.point(lineStart), turf.point(lineEnd));
  const nearestCoord = nearestOnLine.geometry.coordinates;
  const bearingToMouse = turf.bearing(turf.point(nearestCoord), mousePoint);
  // Calculate the relative angle (normalize to -180 to 180)
  let relativeAngle = bearingToMouse - overallBearing;
  if (relativeAngle > 180) relativeAngle -= 360;
  if (relativeAngle < -180) relativeAngle += 360;
  // Positive relative angle (0 to 180) means mouse is on the right, negative means left
  const offsetSide = relativeAngle >= 0 ? 'right' : 'left';

  // Priority: distance input > snap > raw mouse
  let offsetKm;
  if (state.currentDistance !== null && state.currentDistance > 0) {
    offsetKm = state.currentDistance / 1000;
  } else {
    const snapped = this._ctx.snapping.snapCoord(lngLat);
    if (snapped.snapped) {
      const snappedPoint = turf.point([snapped.lng, snapped.lat]);
      const nearestOnPoly = turf.nearestPointOnLine(polyline, snappedPoint);
      const snapDist = turf.distance(nearestOnPoly, snappedPoint, TURF_UNITS_KM);
      offsetKm = snapDist > 0 ? snapDist : perpDistanceKm;
    } else {
      offsetKm = perpDistanceKm;
    }
  }

  state.lineOffsetWidth = offsetKm * 1000; // Store in meters
  state.lineOffsetSide = offsetSide; // Store which side

  // Compute the offset polygon (one-sided based on mouse position)
  const polygonCoords = this.computeOffsetPolygon(state.vertices, offsetKm, offsetSide);
  if (polygonCoords) {
    state.polygon.setCoordinates([polygonCoords]);
  }

  // Show distance label from the last segment midpoint
  const lastIdx = state.vertices.length - 1;
  const lastVertex = state.vertices[lastIdx];
  const lastBearing = turf.bearing(
    turf.point(state.vertices[lastIdx - 1]),
    turf.point(lastVertex)
  );
  // Use the correct perpendicular direction based on offset side
  const perpAngle = offsetSide === 'left' ? lastBearing - 90 : lastBearing + 90;
  const perpPoint = turf.destination(
    turf.point(lastVertex), offsetKm, perpAngle, TURF_UNITS_KM
  ).geometry.coordinates;
  this.updateDistanceLabel(state, lastVertex, perpPoint, offsetKm * 1000);

  if (state.currentDistance !== null && state.currentDistance > 0) {
    this.updateGuideCircle(state, lastVertex, state.currentDistance);
  } else {
    this.removeGuideCircle(state);
  }
};

DrawPolygonDistance.completeLineOffset = function (state) {
  // Use the polygon coordinates already set by handleLineOffsetPreview
  const currentCoords = state.polygon.coordinates[0];
  if (!currentCoords || currentCoords.length < 4) {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
    return;
  }

  // Ensure the polygon is closed
  const first = currentCoords[0];
  const last = currentCoords[currentCoords.length - 1];
  let polygonCoords = currentCoords;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    polygonCoords = [...currentCoords, first];
  }

  // Update state.vertices to match polygon (without closing point) for onStop validation
  state.vertices = polygonCoords.slice(0, -1);
  state.polygon.setCoordinates([polygonCoords]);

  this.removeGuideCircle(state);
  this.removeDistanceLabel(state);
  this.removeRightAngleIndicator(state);
  this.removePreviewPoint(state);
  this.removeCollinearSnapLine(state);

  this.fire(Constants.events.CREATE, {
    features: [state.polygon.toGeoJSON()],
  });

  this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.polygon.id],
  });
};

DrawPolygonDistance.computeOffsetPolygon = function (vertices, offsetKm, side = 'right') {
  const n = vertices.length;
  if (n < 2) return null;

  // Compute bearing for each segment
  const bearings = [];
  for (let i = 0; i < n - 1; i++) {
    bearings.push(turf.bearing(turf.point(vertices[i]), turf.point(vertices[i + 1])));
  }

  // Determine perpendicular angle based on side
  // left = -90 degrees from bearing, right = +90 degrees from bearing
  const perpSign = side === 'left' ? -90 : 90;

  // Compute offset points for each vertex (one side only)
  const offsetPoints = [];

  for (let i = 0; i < n; i++) {
    const pt = turf.point(vertices[i]);

    if (i === 0) {
      // First vertex: offset perpendicular to first segment
      offsetPoints.push(turf.destination(pt, offsetKm, bearings[0] + perpSign, TURF_UNITS_KM).geometry.coordinates);
    } else if (i === n - 1) {
      // Last vertex: offset perpendicular to last segment
      const lastB = bearings[bearings.length - 1];
      offsetPoints.push(turf.destination(pt, offsetKm, lastB + perpSign, TURF_UNITS_KM).geometry.coordinates);
    } else {
      // Inner vertex: find intersection of adjacent offset lines
      const offsetPt = this.computeOffsetVertex(vertices, i, bearings, offsetKm, perpSign);
      offsetPoints.push(offsetPt);
    }
  }

  // Build polygon: original vertices forward, then offset vertices backward, close
  const coords = [
    ...vertices,
    ...offsetPoints.reverse(),
    vertices[0] // close
  ];

  return coords;
};

DrawPolygonDistance.computeOffsetVertex = function (vertices, i, bearings, offsetKm, perpSign) {
  const pt = turf.point(vertices[i]);

  // Offset lines for segment i-1 and segment i
  const b1 = bearings[i - 1];
  const b2 = bearings[i];
  const perpB1 = b1 + perpSign;
  const perpB2 = b2 + perpSign;

  // Create offset line segments (extended for reliable intersection)
  const ext = offsetKm * 10;
  const line1Start = turf.destination(
    turf.destination(turf.point(vertices[i - 1]), offsetKm, perpB1, TURF_UNITS_KM),
    ext, b1 + 180, TURF_UNITS_KM
  ).geometry.coordinates;
  const line1End = turf.destination(
    turf.destination(turf.point(vertices[i]), offsetKm, perpB1, TURF_UNITS_KM),
    ext, b1, TURF_UNITS_KM
  ).geometry.coordinates;

  const line2Start = turf.destination(
    turf.destination(turf.point(vertices[i]), offsetKm, perpB2, TURF_UNITS_KM),
    ext, b2 + 180, TURF_UNITS_KM
  ).geometry.coordinates;
  const line2End = turf.destination(
    turf.destination(turf.point(vertices[i + 1]), offsetKm, perpB2, TURF_UNITS_KM),
    ext, b2, TURF_UNITS_KM
  ).geometry.coordinates;

  const line1 = turf.lineString([line1Start, line1End]);
  const line2 = turf.lineString([line2Start, line2End]);
  const intersection = turf.lineIntersect(line1, line2);

  if (intersection.features.length > 0) {
    // Check miter distance - if too far, use bevel
    const miterPoint = intersection.features[0].geometry.coordinates;
    const miterDist = turf.distance(pt, turf.point(miterPoint), TURF_UNITS_KM);
    if (miterDist < offsetKm * 3) {
      return miterPoint;
    }
  }

  // Fallback: simple perpendicular offset (bevel)
  return turf.destination(pt, offsetKm, perpB2, TURF_UNITS_KM).geometry.coordinates;
};

DrawPolygonDistance.finishDrawing = function (state) {
  if (state.vertices.length < 3) {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
    return;
  }

  // Close the polygon
  const closedCoords = [...state.vertices, state.vertices[0]];
  state.polygon.setCoordinates([closedCoords]);

  // Clean up indicators before finishing
  this.removeGuideCircle(state);
  this.removeRightAngleIndicator(state);
  this.removeLineSegmentSplitLabels(state);
  this.removePreviewPoint(state);
  this.removeCollinearSnapLine(state);

  this.fire(Constants.events.CREATE, {
    features: [state.polygon.toGeoJSON()],
  });

  this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.polygon.id],
  });
};

DrawPolygonDistance.onStop = function (state) {
  doubleClickZoom.enable(this);
  this.activateUIButton();
  this.removeGuideCircle(state);
  this.removeRightAngleIndicator(state);
  this.removeClosingRightAngleIndicator(state);
  this.removeDistanceLabel(state);
  this.removeLineSegmentSplitLabels(state);
  this.removePreviewPoint(state);
  this.removeGuidelineIntersectionDistanceLabel(state);

  // Clean up extended guidelines
  if (state.hoverDebounceTimer) {
    clearTimeout(state.hoverDebounceTimer);
    state.hoverDebounceTimer = null;
  }
  this.removeExtendedGuidelines(state);
  this.removeAngleReferenceLine();
  this.removeParallelLineIndicators(state);
  this.removeCollinearSnapLine(state);

  // Clear point cache to free memory
  clearPointCache();

  // Remove distance/angle input UI
  removeDistanceAngleUI(state);
  removeDrawingModeSelector(state);

  if (this.getFeature(state.polygon.id) === undefined) return;

  state.polygon.removeConsecutiveDuplicates();
  if (state.vertices.length < 3 || !state.polygon.isValid()) {
    this.deleteFeature([state.polygon.id], { silent: true });
  }
};

DrawPolygonDistance.onTrash = function (state) {
  // Remove the last drawn vertex instead of deleting the entire feature
  if (state.vertices.length > 1) {
    state.vertices.pop();

    if (state.drawingSubMode === DRAWING_SUB_MODES.RECTANGLE) {
      const coords = state.vertices.length > 1
        ? [...state.vertices, state.vertices[0]]
        : [state.vertices[0]];
      state.polygon.setCoordinates([coords]);
    } else {
      state.polygon.removeCoordinate(`0.${state.vertices.length}`);
      if (state.polygon.coordinates[0].length > state.vertices.length) {
        state.polygon.removeCoordinate(`0.${state.vertices.length}`);
      }
    }

    // If we have the last mouse position, regenerate the preview
    if (state.currentPosition) {
      this.onMouseMove(state, {
        point: state.lastPoint || { x: 0, y: 0 },
        lngLat: state.currentPosition,
      });
    }

    // Force an immediate render through the store
    if (this._ctx && this._ctx.store && this._ctx.store.render) {
      this._ctx.store.render();
    }
  } else if (state.vertices.length === 1) {
    state.vertices.pop();
    state.polygon.setCoordinates([[]]);
    showDrawingModeSelector(state);
    hideDistanceAngleUI(state);
  } else {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }
};

DrawPolygonDistance.toDisplayFeatures = function (state, geojson, display) {
  const isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = isActivePolygon
    ? Constants.activeStates.ACTIVE
    : Constants.activeStates.INACTIVE;

  if (!isActivePolygon) return display(geojson);

  if (geojson.geometry.coordinates.length === 0) return;

  const coordinateCount = geojson.geometry.coordinates[0].length;
  const minCoords = (state.drawingSubMode === DRAWING_SUB_MODES.LINE && state.linePhase !== 'offset') ? 2 : 3;
  if (coordinateCount < minCoords) {
    return;
  }

  geojson.properties.meta = Constants.meta.FEATURE;

  // Display vertices
  if (state.vertices.length > 0) {
    state.vertices.forEach((vertex, index) => {
      display({
        type: Constants.geojsonTypes.FEATURE,
        properties: {
          meta: Constants.meta.VERTEX,
          parent: state.polygon.id,
          coord_path: `0.${index}`,
          active:
            index === state.vertices.length - 1
              ? Constants.activeStates.ACTIVE
              : Constants.activeStates.INACTIVE,
        },
        geometry: {
          type: Constants.geojsonTypes.POINT,
          coordinates: vertex,
        },
      });
    });
  }

  // Line mode phase 1: always render as open LineString
  if (state.drawingSubMode === DRAWING_SUB_MODES.LINE && state.linePhase !== 'offset') {
    const coords = geojson.geometry.coordinates[0];
    // Strip closing coordinate if present
    let lineCoords = coords;
    if (coords.length > 2 &&
        coords[coords.length - 1][0] === coords[0][0] &&
        coords[coords.length - 1][1] === coords[0][1]) {
      lineCoords = coords.slice(0, -1);
    }
    if (lineCoords.length >= 2) {
      display({
        type: Constants.geojsonTypes.FEATURE,
        properties: geojson.properties,
        geometry: {
          coordinates: lineCoords,
          type: Constants.geojsonTypes.LINE_STRING,
        },
      });
    }
    return;
  }

  // Display as LineString for first 1-2 vertices for reliable rendering at all zoom levels
  if (coordinateCount <= 4) {
    const lineCoordinates = [
      [
        geojson.geometry.coordinates[0][0][0],
        geojson.geometry.coordinates[0][0][1],
      ],
      [
        geojson.geometry.coordinates[0][1][0],
        geojson.geometry.coordinates[0][1][1],
      ],
    ];
    display({
      type: Constants.geojsonTypes.FEATURE,
      properties: geojson.properties,
      geometry: {
        coordinates: lineCoordinates,
        type: Constants.geojsonTypes.LINE_STRING,
      },
    });
    if (coordinateCount === 3) {
      return;
    }
  }

  display(geojson);
};

DrawPolygonDistance.onTap = DrawPolygonDistance.onClick;

export default DrawPolygonDistance;
