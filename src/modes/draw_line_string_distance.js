import * as turf from "@turf/turf";
import * as Constants from "../constants.js";
import * as CommonSelectors from "../lib/common_selectors.js";
import doubleClickZoom from "../lib/double_click_zoom.js";
import {
  findNearestSegment,
  getUnderlyingLineBearing,
  getSnappedLineBearing,
  getAdjacentSegmentsAtVertex,
  calculateCircleLineIntersection,
  calculateLineIntersection,
  findExtendedGuidelineIntersection,
  checkExtendedGuidelineIntersectionClick,
  findNearbyParallelLines,
  getParallelBearing,
  resolveSnapConflicts,
  snapToNearbyVertex,
  calculatePerpendicularToLine,
  getExtendedGuidelineBearings,
  getPerpendicularToGuidelineBearing,
} from "../lib/distance_mode_helpers.js";

const DrawLineStringDistance = {};

DrawLineStringDistance.onSetup = function (opts) {
  opts = opts || {};

  const line = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.LINE_STRING,
      coordinates: [],
    },
  });

  this.addFeature(line);
  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.LINE);
  this.setActionableState({
    trash: true,
  });

  const state = {
    line,
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
    // Parallel line snapping state
    parallelLineSnap: null,
  };

  this.createDistanceInput(state);
  this.createAngleInput(state);

  return state;
};

DrawLineStringDistance.createDistanceInput = function (state) {
  // Check if angle/distance input UI is enabled
  if (!this._ctx.options.useAngleDistanceInput) {
    return;
  }

  // Create container
  const container = document.createElement("div");
  container.className = "distance-mode-container";

  // Calculate position from normalized coordinates
  const mapContainer = this._ctx.map.getContainer();
  const mapWidth = mapContainer.offsetWidth;
  const mapHeight = mapContainer.offsetHeight;
  const [normX, normY] = this._ctx.options.angleDistanceInputPosition;

  // Convert normalized position to pixel coordinates
  // Using top/left with translate(-50%, -50%) to center on the point
  const pixelX = mapWidth * normX;
  const pixelY = mapHeight * normY;

  container.style.cssText = `
    position: fixed;
    top: ${pixelY}px;
    left: ${pixelX}px;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(200, 200, 200, 0.8);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    pointer-events: auto;
    transition: opacity 0.2s ease-in-out;
  `;

  // Create label/state display
  const label = document.createElement("span");
  label.className = "distance-mode-label";
  label.textContent = "D for distance";
  label.style.cssText = `
    color: #666;
    font-size: 9px;
    white-space: nowrap;
    width: 80px;
    text-align: center;
    display: inline-block;
  `;

  // Create input
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "distance (m)";
  input.className = "distance-mode-input";
  input.style.cssText = `
    border: 1px solid rgba(200, 200, 200, 0.8);
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 9px;
    width: 80px;
    display: none;
    outline: none;
    background: transparent;
    transition: background-color 0.2s;
  `;

  // Create clear button
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "×";
  clearBtn.className = "distance-mode-clear";
  clearBtn.style.cssText = `
    border: none;
    background: none;
    color: #666;
    font-size: 16px;
    cursor: pointer;
    padding: 0 3px;
    line-height: 1;
    display: none;
  `;

  const updateDisplay = () => {
    if (state.currentDistance !== null && state.currentDistance > 0) {
      label.style.display = "none";
      input.style.display = "block";
      clearBtn.style.display = "block";
    } else {
      label.style.display = "block";
      input.style.display = "none";
      clearBtn.style.display = "none";
    }
  };

  // Add focus/blur handlers for the grey tint
  input.addEventListener("focus", () => {
    input.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
  });

  input.addEventListener("blur", () => {
    input.style.backgroundColor = "transparent";
  });

  input.addEventListener("input", (e) => {
    const value = e.target.value;
    if (value === "" || !isNaN(parseFloat(value))) {
      state.currentDistance = value === "" ? null : parseFloat(value);
      updateDisplay();
      if (state.currentPosition) {
        this.onMouseMove(state, {
          point: state.lastPoint || { x: 0, y: 0 },
          lngLat: state.currentPosition,
        });
      }
    } else {
      e.target.value =
        state.currentDistance !== null ? state.currentDistance.toString() : "";
    }
  });

  input.addEventListener("keydown", (e) => {
    // Only stop propagation for keys we're handling
    if (
      e.key === "Enter" ||
      e.key === "Escape" ||
      (e.key === "Backspace" && e.target.value === "")
    ) {
      e.stopPropagation();
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (state.vertices.length >= 2) {
        this.finishDrawing(state);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      state.currentDistance = null;
      input.value = "";
      input.blur();
      updateDisplay();
    } else if (e.key === "Backspace" && e.target.value === "") {
      e.preventDefault();
      this.onKeyUp(state, { keyCode: 8 });
    }
  });

  clearBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.currentDistance = null;
    input.value = "";
    input.blur();
    updateDisplay();
  });

  // Store reference to mode context for use in keyHandler
  const self = this;

  // Add keyboard shortcuts
  const keyHandler = (e) => {
    // 'D' key to toggle distance input
    if (e.key === "d" || e.key === "D") {
      if (state.vertices.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle: if distance is active, clear it; otherwise activate it
        if (
          state.currentDistance !== null ||
          document.activeElement === input
        ) {
          state.currentDistance = null;
          input.value = "";
          input.blur();
          updateDisplay();
        } else {
          input.style.display = "block";
          label.style.display = "none";
          input.focus();
        }
      }
    }
    // Backspace to remove last vertex (bypasses need for trash controls)
    else if (e.key === "Backspace" && document.activeElement !== input) {
      e.preventDefault();
      e.stopPropagation();
      self.onTrash(state);
    }
  };
  document.addEventListener("keydown", keyHandler);

  container.appendChild(label);
  container.appendChild(input);
  container.appendChild(clearBtn);
  document.body.appendChild(container);

  state.distanceInput = input;
  state.distanceContainer = container;
  state.distanceKeyHandler = keyHandler;

  updateDisplay();
};

DrawLineStringDistance.createAngleInput = function (state) {
  // Check if angle/distance input UI is enabled
  if (!this._ctx.options.useAngleDistanceInput) {
    return;
  }

  // We'll add the angle input to the same container as distance
  // So we just need to add elements to the existing distance container
  const distanceContainer = state.distanceContainer;
  if (!distanceContainer) {
    return;
  }

  // Create separator
  const separator = document.createElement("span");
  separator.style.cssText = `
    color: #ccc;
    font-size: 11px;
    padding: 0 3px;
  `;
  separator.textContent = "|";

  // Create label/state display
  const label = document.createElement("span");
  label.className = "angle-mode-label";
  label.textContent = "A for angle";
  label.style.cssText = `
    color: #666;
    font-size: 9px;
    white-space: nowrap;
    width: 80px;
    text-align: center;
    display: inline-block;
  `;

  // Create input
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "angle (°)";
  input.className = "angle-mode-input";
  input.style.cssText = `
    border: 1px solid rgba(200, 200, 200, 0.8);
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 9px;
    width: 80px;
    display: none;
    outline: none;
    background: transparent;
    transition: background-color 0.2s;
  `;

  // Create clear button
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "×";
  clearBtn.className = "angle-mode-clear";
  clearBtn.style.cssText = `
    border: none;
    background: none;
    color: #666;
    font-size: 16px;
    cursor: pointer;
    padding: 0 3px;
    line-height: 1;
    display: none;
  `;

  const updateDisplay = () => {
    if (state.currentAngle !== null && !isNaN(state.currentAngle)) {
      label.style.display = "none";
      input.style.display = "block";
      clearBtn.style.display = "block";
    } else {
      label.style.display = "block";
      input.style.display = "none";
      clearBtn.style.display = "none";
    }
  };

  // Add focus/blur handlers for the grey tint
  input.addEventListener("focus", () => {
    input.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
  });

  input.addEventListener("blur", () => {
    input.style.backgroundColor = "transparent";
  });

  input.addEventListener("input", (e) => {
    const value = e.target.value;
    if (value === "" || !isNaN(parseFloat(value))) {
      state.currentAngle = value === "" ? null : parseFloat(value);
      updateDisplay();
      if (state.currentPosition) {
        this.onMouseMove(state, {
          point: state.lastPoint || { x: 0, y: 0 },
          lngLat: state.currentPosition,
        });
      }
    } else {
      e.target.value =
        state.currentAngle !== null ? state.currentAngle.toString() : "";
    }
  });

  input.addEventListener("keydown", (e) => {
    // Only stop propagation for keys we're handling
    if (
      e.key === "Enter" ||
      e.key === "Escape" ||
      (e.key === "Backspace" && e.target.value === "")
    ) {
      e.stopPropagation();
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (state.vertices.length >= 2) {
        this.finishDrawing(state);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      state.currentAngle = null;
      input.value = "";
      input.blur();
      updateDisplay();
    } else if (e.key === "Backspace" && e.target.value === "") {
      e.preventDefault();
      this.onKeyUp(state, { keyCode: 8 });
    }
  });

  clearBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.currentAngle = null;
    input.value = "";
    input.blur();
    updateDisplay();
  });

  // Store reference to mode context for use in keyHandler
  const self = this;

  // Add keyboard shortcuts
  const keyHandler = (e) => {
    // 'A' key to toggle angle input
    if (e.key === "a" || e.key === "A") {
      if (state.vertices.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle: if angle is active, clear it; otherwise activate it
        if (state.currentAngle !== null || document.activeElement === input) {
          state.currentAngle = null;
          input.value = "";
          input.blur();
          updateDisplay();
        } else {
          input.style.display = "block";
          label.style.display = "none";
          input.focus();
        }
      }
    }
  };
  document.addEventListener("keydown", keyHandler);

  distanceContainer.appendChild(separator);
  distanceContainer.appendChild(label);
  distanceContainer.appendChild(input);
  distanceContainer.appendChild(clearBtn);

  state.angleInput = input;
  state.angleKeyHandler = keyHandler;
  state.angleSeparator = separator;

  updateDisplay();
};

DrawLineStringDistance.onClick = function (state, e) {
  if (
    e.originalEvent &&
    (e.originalEvent.target === state.distanceInput ||
      e.originalEvent.target === state.angleInput)
  ) {
    return;
  }
  this.clickOnMap(state, e);
};

DrawLineStringDistance.getSnapInfo = function (lngLat) {
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
        turf.point(result.segment.end)
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

DrawLineStringDistance.getOrthogonalBearing = function (
  state,
  currentBearing,
  tolerance = 5
) {
  if (!state.snapEnabled) {
    return null;
  }

  // Cache key based on state that affects orthogonal bearings
  // Use 1-degree precision instead of tolerance-based quantization to avoid geometric drift
  const adjacentSegmentsKey = state.adjacentSegments ? state.adjacentSegments.length : 0;
  const cacheKey = `${state.vertices.length}-${state.snappedLineBearing}-${adjacentSegmentsKey}-${
    Math.round(currentBearing)
  }`;

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

DrawLineStringDistance.detectHoveredIntersectionPoint = function (state, e) {
  const map = this.map;
  if (!map || !this._ctx.snapping) return null;

  // Query features at the hover point from snap buffer layers
  const bufferLayers = this._ctx.snapping.bufferLayers.map(
    (layerId) => "_snap_buffer_" + layerId
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
      type: 'intersection'
    };
  }

  return null;
};

DrawLineStringDistance.extendGuidelines = function (state, intersectionInfo) {
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
    const extensionDistance = this._ctx.options.extendedGuidelineDistance || 0.2;

    const extendedStart = turf.destination(
      turf.point(coord),
      extensionDistance,
      perpendicularBearing + 180,
      { units: "kilometers" }
    );
    const extendedEnd = turf.destination(
      turf.point(coord),
      extensionDistance,
      perpendicularBearing,
      { units: "kilometers" }
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
        turf.point(coords[coords.length - 1])
      );

      // Extend by configured distance in each direction
      const extensionDistance = this._ctx.options.extendedGuidelineDistance || 0.2;
      const extendedStart = turf.destination(
        turf.point(coords[0]),
        extensionDistance,
        bearing + 180,
        { units: "kilometers" }
      );
      const extendedEnd = turf.destination(
        turf.point(coords[coords.length - 1]),
        extensionDistance,
        bearing,
        { units: "kilometers" }
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
          turf.point(lineCoords[lineCoords.length - 1])
        );

        const extendedStart = turf.destination(
          turf.point(lineCoords[0]),
          200 / 1000,
          bearing + 180,
          { units: "kilometers" }
        );
        const extendedEnd = turf.destination(
          turf.point(lineCoords[lineCoords.length - 1]),
          200 / 1000,
          bearing,
          { units: "kilometers" }
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

DrawLineStringDistance.renderExtendedGuidelines = function (state, extendedLines) {
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

DrawLineStringDistance.removeExtendedGuidelines = function (state) {
  const map = this.map;
  if (!map) return;

  const bufferLayerId = "_snap_buffer_extended-guidelines";

  // Remove event handlers
  if (state.extendedGuidelineMouseoverHandler) {
    map.off("mousemove", bufferLayerId, state.extendedGuidelineMouseoverHandler);
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
  state.lastHoverPosition = null;
};

DrawLineStringDistance.showAngleReferenceLine = function (state, startPoint, referenceBearing) {
  const map = this.map;
  if (!map) return;

  // Create a line extending from startPoint along the reference bearing
  const lineLength = 0.5; // 500 meters in kilometers
  const refPoint1 = turf.destination(
    turf.point(startPoint),
    lineLength,
    referenceBearing,
    { units: 'kilometers' }
  );
  const refPoint2 = turf.destination(
    turf.point(startPoint),
    lineLength,
    referenceBearing + 180,
    { units: 'kilometers' }
  );

  const referenceLine = {
    type: 'Feature',
    properties: { isAngleReference: true },
    geometry: {
      type: 'LineString',
      coordinates: [
        refPoint2.geometry.coordinates,
        startPoint,
        refPoint1.geometry.coordinates
      ]
    }
  };

  const featureCollection = {
    type: 'FeatureCollection',
    features: [referenceLine]
  };

  // Create or update the visual layer for angle reference line
  if (!map.getSource('angle-reference-line')) {
    map.addSource('angle-reference-line', {
      type: 'geojson',
      data: featureCollection
    });

    map.addLayer({
      id: 'angle-reference-line',
      type: 'line',
      source: 'angle-reference-line',
      paint: {
        'line-color': '#0066ff',
        'line-width': 1.5,
        'line-opacity': 0.5,
        'line-dasharray': [2, 2]
      }
    });
  } else {
    map.getSource('angle-reference-line').setData(featureCollection);
  }
};

DrawLineStringDistance.removeAngleReferenceLine = function () {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('angle-reference-line')) {
    map.removeLayer('angle-reference-line');
  }
  if (map.getSource && map.getSource('angle-reference-line')) {
    map.removeSource('angle-reference-line');
  }
};

DrawLineStringDistance.clickOnMap = function (state, e) {
  // Check if shift is held to bypass snapping
  const shiftHeld = CommonSelectors.isShiftDown(e);

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
        this.getSnapInfo.bind(this)
      );

      vertexCoord = intersectionCoord || (() => {
        const snappedCoord = this._ctx.snapping.snapCoord(e.lngLat);
        return [snappedCoord.lng, snappedCoord.lat];
      })();
    }

    state.vertices.push(vertexCoord);
    state.line.updateCoordinate(0, vertexCoord[0], vertexCoord[1]);

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
      snappedCoord
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

  // Subsequent vertices - use preview vertex if available (from onMouseMove)
  // This ensures the vertex is placed exactly where the black dot indicator shows
  if (state.previewVertex) {
    const newVertex = state.previewVertex;

    state.vertices.push(newVertex);
    state.line.updateCoordinate(
      state.vertices.length - 1,
      newVertex[0],
      newVertex[1]
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
    state.vertices.push(newVertex);
    state.line.updateCoordinate(
      state.vertices.length - 1,
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

        if (otherLineFeature && snapInfo) {
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
                snapInfo = intersectionSnap;
              }
            }
          }
        }
      } else {
        // Snapping to something else - check if it's a line that intersects with extended guideline
        const tempSnapInfo = this.getSnapInfo(e.lngLat);
        if (tempSnapInfo && tempSnapInfo.type === 'line') {
          const intersectionSnap = findExtendedGuidelineIntersection(
            state.extendedGuidelines,
            tempSnapInfo,
            e.lngLat,
            state.snapTolerance
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
    turf.point([e.lngLat.lng, e.lngLat.lat])
  );

  // Check for closing perpendicular snap (perpendicular to first segment)
  let closingPerpendicularSnap = null;
  if (state.vertices.length >= 3) {
    const firstVertex = state.vertices[0];
    const secondVertex = state.vertices[1];
    const firstSegmentBearing = turf.bearing(
      turf.point(firstVertex),
      turf.point(secondVertex)
    );
    const bearingToFirst = turf.bearing(
      turf.point([e.lngLat.lng, e.lngLat.lat]),
      turf.point(firstVertex)
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
  const extendedGuidelinesActive = state.extendedGuidelines && state.extendedGuidelines.length > 0;

  let orthogonalMatch = null;
  let isPerpendicularToGuideline = false;

  if (extendedGuidelinesActive && state.vertices.length >= 1) {
    // When extended guidelines are active, check for perpendicular to guideline bearings
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
    orthogonalMatch = this.getOrthogonalBearing(state, mouseBearing, this._ctx.options.orthogonalSnapTolerance);
  }

  // Detect parallel lines nearby (orthogonal intersection method, configurable tolerance)
  let parallelLineMatch = null;
  if (!extendedGuidelinesActive && state.vertices.length >= 1) {
    const nearbyLines = findNearbyParallelLines(this._ctx, this.map, lastVertex, e.lngLat);
    parallelLineMatch = getParallelBearing(nearbyLines, mouseBearing, this._ctx.options.parallelSnapTolerance);
  }

  // Check for perpendicular-to-line snap (when snapping to a line)
  let perpendicularToLineSnap = null;
  if (!extendedGuidelinesActive && state.vertices.length >= 1 && snapInfo && snapInfo.type === "line") {
    const perpPoint = calculatePerpendicularToLine(lastVertex, snapInfo.segment, e.lngLat);
    if (perpPoint) {
      perpendicularToLineSnap = {
        coord: perpPoint.coord,
        distanceFromCursor: perpPoint.distanceFromCursor,
        lineSegment: snapInfo.segment,
        lineBearing: snapInfo.bearing
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
    mouseBearing
  });
  orthogonalMatch = resolved.orthogonalMatch;
  parallelLineMatch = resolved.parallelLineMatch;

  // Check if perpendicular-to-line snap should override regular line snap
  // This happens when cursor is close to the perpendicular point (within snap tolerance)
  const snapTolerance = this._ctx.options.snapDistance || 20; // pixels
  const metersPerPixel = 156543.03392 * Math.cos(e.lngLat.lat * Math.PI / 180) / Math.pow(2, this.map.getZoom());
  const snapToleranceMeters = snapTolerance * metersPerPixel;

  let isPerpendicularToLineSnap = false;
  if (perpendicularToLineSnap && perpendicularToLineSnap.distanceFromCursor <= snapToleranceMeters) {
    // Within snap tolerance - check if perpendicular snap should win based on proximity
    // Compare with orthogonal and parallel snaps
    let shouldUsePerpendicular = true;

    if (orthogonalMatch !== null) {
      // Calculate distance to orthogonal snap point
      const orthogonalPoint = turf.destination(from, 0.1, orthogonalMatch.bearing, { units: 'kilometers' });
      const orthogonalDist = turf.distance(
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        orthogonalPoint,
        { units: 'meters' }
      );
      if (orthogonalDist < perpendicularToLineSnap.distanceFromCursor) {
        shouldUsePerpendicular = false;
      }
    }

    if (shouldUsePerpendicular && parallelLineMatch !== null) {
      // Calculate distance to parallel snap point
      const parallelPoint = turf.destination(from, 0.1, parallelLineMatch.bearing, { units: 'kilometers' });
      const parallelDist = turf.distance(
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        parallelPoint,
        { units: 'meters' }
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
        snappedFeature: snapInfo.snappedFeature
      };
      isPerpendicularToLineSnap = true;
      // Clear orthogonal and parallel snaps since perpendicular won
      orthogonalMatch = null;
      parallelLineMatch = null;
    }
  }

  // Store perpendicular-to-line snap state for indicator
  state.perpendicularToLineSnap = isPerpendicularToLineSnap ? perpendicularToLineSnap : null;

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
  } else if (bothSnapsActive) {
    // Special case: Both orthogonal and closing perpendicular are active
    isOrthogonalSnap = true;
    isClosingPerpendicularSnap = true;
  } else if (orthogonalMatch !== null && (!extendedGuidelinesActive || isPerpendicularToGuideline)) {
    // Priority 2: Bearing snap (orthogonal/parallel to previous segment, snapped line, or extended guideline)
    bearingToUse = orthogonalMatch.bearing;
    isOrthogonalSnap = true;
  } else if (parallelLineMatch !== null && !extendedGuidelinesActive) {
    // Priority 3: Parallel line snap (snap to bearing of nearby lines)
    // Skip if extended guidelines are active
    bearingToUse = parallelLineMatch.bearing;
    isParallelLineSnap = true;
  } else if (closingPerpendicularSnap !== null && !extendedGuidelinesActive) {
    // Priority 4: Closing perpendicular snap
    // Skip if extended guidelines are active
    isClosingPerpendicularSnap = true;
  } else if (snapInfo && snapInfo.type === "line") {
    // Priority 5: Line snap bearing (lowest priority for direction)
    bearingToUse = snapInfo.bearing;
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
        [e.lngLat.lng, e.lngLat.lat]
      );
      if (circleLineIntersection) {
        newVertex = circleLineIntersection.coord;
      } else {
        // Fallback: if no intersection found, use bearing to create point at exact distance
        const destinationPoint = turf.destination(
          from,
          state.currentDistance / 1000,
          bearingToUse,
          { units: "kilometers" }
        );
        newVertex = destinationPoint.geometry.coordinates;
      }
    } else {
      // No snap: use bearing to create point at exact distance
      const destinationPoint = turf.destination(
        from,
        state.currentDistance / 1000,
        bearingToUse,
        { units: "kilometers" }
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
      newVertex = intersection.coord;
    } else {
      // Fallback to mouse distance
      const mouseDistance = turf.distance(
        from,
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        { units: "kilometers" }
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        orthogonalMatch.bearing,
        { units: "kilometers" }
      );
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else if (
    closingPerpendicularSnap !== null &&
    !usePointDirection &&
    !isOrthogonalSnap
  ) {
    // Closing perpendicular snap: find intersection where closing segment is perpendicular to first segment
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
      mouseBearing,
      perpLine
    );
    if (intersection) {
      newVertex = intersection.coord;
    } else {
      // Fallback to mouse position
      const mouseDistance = turf.distance(
        from,
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        { units: "kilometers" }
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        mouseBearing,
        { units: "kilometers" }
      );
      newVertex = destinationPoint.geometry.coordinates;
    }
  } else if (orthogonalMatch !== null && snapInfo && snapInfo.type === "line") {
    // Priority 2 for length: Bearing snap + line nearby -> extend/shorten to intersection
    const intersection = calculateLineIntersection(
      lastVertex,
      bearingToUse,
      snapInfo.segment
    );
    if (intersection) {
      newVertex = intersection.coord;
    } else {
      // Fallback to mouse distance if intersection fails
      const mouseDistance = turf.distance(
        from,
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        { units: "kilometers" }
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        bearingToUse,
        { units: "kilometers" }
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
      { units: "kilometers" }
    );
    const destinationPoint = turf.destination(
      from,
      mouseDistance,
      bearingToUse,
      { units: "kilometers" }
    );
    newVertex = destinationPoint.geometry.coordinates;
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
  state.line.updateCoordinate(
    state.vertices.length - 1,
    newVertex[0],
    newVertex[1]
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

DrawLineStringDistance.onMouseMove = function (state, e) {
  const pointOnScreen = e.point;
  const lngLat = e.lngLat;

  state.currentPosition = lngLat;
  state.lastPoint = pointOnScreen;

  // Check if shift is held to temporarily disable snapping
  const shiftHeld = CommonSelectors.isShiftDown(e);
  if (shiftHeld && state.vertices.length >= 1) {
    // Shift held - use raw mouse position, bypass all snapping
    const lastVertex = state.vertices[state.vertices.length - 1];
    const from = turf.point(lastVertex);
    const previewVertex = [lngLat.lng, lngLat.lat];

    // Calculate actual distance to preview vertex
    const actualDistance = turf.distance(from, turf.point(previewVertex), {
      units: "meters",
    });

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

    // Store preview vertex
    state.previewVertex = previewVertex;

    // Update line preview
    state.line.updateCoordinate(
      state.vertices.length,
      previewVertex[0],
      previewVertex[1]
    );
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
        const extendedLines = this.extendGuidelines(state, intersectionPointInfo);
        state.extendedGuidelines = extendedLines;
        this.renderExtendedGuidelines(state, extendedLines);
      }, 500);
    }
    // If same point and extended guidelines exist, keep them visible (do nothing)
  } else {
    // Not hovering over an intersection point
    // Only remove extended guidelines if we're also not hovering over the extended lines themselves
    if (!state.isHoveringExtendedGuidelines) {
      if (state.hoverDebounceTimer || state.extendedGuidelines) {
        // Clear debounce timer and remove extended guidelines
        if (state.hoverDebounceTimer) {
          clearTimeout(state.hoverDebounceTimer);
          state.hoverDebounceTimer = null;
        }
        this.removeExtendedGuidelines(state);
      }
    }
  }

  // Check for line snapping even before first vertex is placed
  if (state.vertices.length === 0) {
    let snapInfo = null;

    // If extended guidelines are active, use exclusive snapping
    if (state.extendedGuidelines && state.extendedGuidelines.length > 0) {
      // ONLY snap to: 1) extended guideline, 2) intersections with other lines

      // Check what the snapping system is currently snapping to
      const snapping = this._ctx.snapping;
      if (snapping && snapping.snappedFeature) {
        const isExtendedGuideline =
          snapping.snappedFeature.properties &&
          snapping.snappedFeature.properties.isExtendedGuideline;

        if (isExtendedGuideline) {
          // Snapping to extended guideline - allow it
          snapInfo = this.getSnapInfo(lngLat);
        } else {
          // Snapping to something else - check if it's a line that intersects with extended guideline
          const tempSnapInfo = this.getSnapInfo(lngLat);
          if (tempSnapInfo && tempSnapInfo.type === 'line') {
            // It's a line - check for intersection with extended guideline
            const intersectionSnap = findExtendedGuidelineIntersection(
              state.extendedGuidelines,
              tempSnapInfo,
              lngLat,
              state.snapTolerance
            );
            if (intersectionSnap) {
              snapInfo = intersectionSnap;
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

    if (snapInfo && snapInfo.type === "line" && !isSnappingToExtendedGuideline) {
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
        { lng: snapInfo.coord[0], lat: snapInfo.coord[1] }
      );
      if (underlyingLineInfo && underlyingLineInfo.segment) {
        this.updateLineSegmentSplitLabels(
          state,
          underlyingLineInfo.segment,
          snapInfo.coord
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
    // ONLY snap to: 1) extended guideline, 2) intersections with other lines

    // Check what the snapping system is currently snapping to
    const snapping = this._ctx.snapping;
    if (snapping && snapping.snappedFeature) {
      const isExtendedGuideline =
        snapping.snappedFeature.properties &&
        snapping.snappedFeature.properties.isExtendedGuideline;

      if (isExtendedGuideline) {
        // Snapping to extended guideline - allow it
        snapInfo = this.getSnapInfo(lngLat);
      } else {
        // Snapping to something else - check if it's a line that intersects with extended guideline
        const tempSnapInfo = this.getSnapInfo(lngLat);
        if (tempSnapInfo && tempSnapInfo.type === 'line') {
          // It's a line - check for intersection with extended guideline
          const intersectionSnap = findExtendedGuidelineIntersection(
            state.extendedGuidelines,
            tempSnapInfo,
            lngLat,
            state.snapTolerance
          );
          if (intersectionSnap) {
            snapInfo = intersectionSnap;
          }
        }
      }
    }
  } else {
    // No extended guidelines - use regular snapping
    snapInfo = this.getSnapInfo(lngLat);
  }

  // Calculate mouse bearing for orthogonal snap check
  const mouseBearing = turf.bearing(from, turf.point([lngLat.lng, lngLat.lat]));

  // Check for closing perpendicular snap: helps draw rectangles by making the closing
  // segment (from current position to first vertex) perpendicular to the first segment
  let closingPerpendicularSnap = null;
  if (state.vertices.length >= 3) {
    const firstVertex = state.vertices[0];
    const secondVertex = state.vertices[1];
    const firstSegmentBearing = turf.bearing(
      turf.point(firstVertex),
      turf.point(secondVertex)
    );
    const bearingToFirst = turf.bearing(
      turf.point([lngLat.lng, lngLat.lat]),
      turf.point(firstVertex)
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
  const extendedGuidelinesActive = state.extendedGuidelines && state.extendedGuidelines.length > 0;

  let orthogonalMatch = null;
  let isPerpendicularToGuideline = false;

  if (extendedGuidelinesActive && state.vertices.length >= 1) {
    // When extended guidelines are active, check for perpendicular to guideline bearings
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
    orthogonalMatch = this.getOrthogonalBearing(state, mouseBearing, this._ctx.options.orthogonalSnapTolerance);
  }

  // Detect parallel lines nearby (orthogonal intersection method, configurable tolerance)
  let parallelLineMatch = null;
  if (!extendedGuidelinesActive && state.vertices.length >= 1) {
    const nearbyLines = findNearbyParallelLines(this._ctx, this.map, lastVertex, lngLat);
    parallelLineMatch = getParallelBearing(nearbyLines, mouseBearing, this._ctx.options.parallelSnapTolerance);
  }

  // Check for perpendicular-to-line snap (when snapping to a line)
  let perpendicularToLineSnap = null;
  if (!extendedGuidelinesActive && state.vertices.length >= 1 && snapInfo && snapInfo.type === "line") {
    const perpPoint = calculatePerpendicularToLine(lastVertex, snapInfo.segment, lngLat);
    if (perpPoint) {
      perpendicularToLineSnap = {
        coord: perpPoint.coord,
        distanceFromCursor: perpPoint.distanceFromCursor,
        lineSegment: snapInfo.segment,
        lineBearing: snapInfo.bearing
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
    mouseBearing
  });
  orthogonalMatch = resolved.orthogonalMatch;
  parallelLineMatch = resolved.parallelLineMatch;

  // Check if perpendicular-to-line snap should override regular line snap
  // This happens when cursor is close to the perpendicular point (within snap tolerance)
  const snapTolerance = this._ctx.options.snapDistance || 20; // pixels
  const metersPerPixel = 156543.03392 * Math.cos(lngLat.lat * Math.PI / 180) / Math.pow(2, this.map.getZoom());
  const snapToleranceMeters = snapTolerance * metersPerPixel;

  let isPerpendicularToLineSnap = false;
  if (perpendicularToLineSnap && perpendicularToLineSnap.distanceFromCursor <= snapToleranceMeters) {
    // Within snap tolerance - check if perpendicular snap should win based on proximity
    // Compare with orthogonal and parallel snaps
    let shouldUsePerpendicular = true;

    if (orthogonalMatch !== null) {
      // Calculate distance to orthogonal snap point
      const orthogonalPoint = turf.destination(from, 0.1, orthogonalMatch.bearing, { units: 'kilometers' });
      const orthogonalDist = turf.distance(
        turf.point([lngLat.lng, lngLat.lat]),
        orthogonalPoint,
        { units: 'meters' }
      );
      if (orthogonalDist < perpendicularToLineSnap.distanceFromCursor) {
        shouldUsePerpendicular = false;
      }
    }

    if (shouldUsePerpendicular && parallelLineMatch !== null) {
      // Calculate distance to parallel snap point
      const parallelPoint = turf.destination(from, 0.1, parallelLineMatch.bearing, { units: 'kilometers' });
      const parallelDist = turf.distance(
        turf.point([lngLat.lng, lngLat.lat]),
        parallelPoint,
        { units: 'meters' }
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
        snappedFeature: snapInfo.snappedFeature
      };
      isPerpendicularToLineSnap = true;
      // Clear orthogonal and parallel snaps since perpendicular won
      orthogonalMatch = null;
      parallelLineMatch = null;
    }
  }

  // Store perpendicular-to-line snap state for indicator
  state.perpendicularToLineSnap = isPerpendicularToLineSnap ? perpendicularToLineSnap : null;

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
  } else if (bothSnapsActive) {
    // Special case: Both orthogonal and closing perpendicular are active
    // We'll handle this in the length priority section
    isOrthogonalSnap = true;
    isClosingPerpendicularSnap = true;
  } else if (orthogonalMatch !== null && (!extendedGuidelinesActive || isPerpendicularToGuideline)) {
    // Priority 2: Bearing snap (orthogonal/parallel to previous segment, snapped line, or extended guideline)
    bearingToUse = orthogonalMatch.bearing;
    isOrthogonalSnap = true;
  } else if (parallelLineMatch !== null && !extendedGuidelinesActive) {
    // Priority 3: Parallel line snap (snap to bearing of nearby lines)
    // Skip if extended guidelines are active
    bearingToUse = parallelLineMatch.bearing;
    isParallelLineSnap = true;
    state.parallelLineSnap = parallelLineMatch;
  } else if (closingPerpendicularSnap !== null && !extendedGuidelinesActive) {
    // Priority 4: Closing perpendicular snap
    // Skip if extended guidelines are active
    // (This will be handled in the length priority section)
    isClosingPerpendicularSnap = true;
  } else if (snapInfo && snapInfo.type === "line") {
    // Priority 5: Line snap bearing (lowest priority for direction)
    bearingToUse = snapInfo.bearing;
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
        [lngLat.lng, lngLat.lat]
      );
      if (circleLineIntersection) {
        previewVertex = circleLineIntersection.coord;
      } else {
        // Fallback: if no intersection found, use bearing to create point at exact distance
        const destinationPoint = turf.destination(
          from,
          state.currentDistance / 1000,
          bearingToUse,
          { units: "kilometers" }
        );
        previewVertex = destinationPoint.geometry.coordinates;
      }
    } else {
      // No line snap: use bearing to create point at exact distance
      const destinationPoint = turf.destination(
        from,
        state.currentDistance / 1000,
        bearingToUse,
        { units: "kilometers" }
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
      previewVertex = intersection.coord;
      // Show both indicators (regular at last vertex, closing at first vertex)
      this.updateRightAngleIndicator(
        state,
        lastVertex,
        orthogonalMatch.referenceBearing,
        orthogonalMatch.bearing,
        orthogonalMatch.referenceSegment
      );
      const closingBearing = turf.bearing(
        turf.point(previewVertex),
        turf.point(closingPerpendicularSnap.firstVertex)
      );
      const firstSegment = { start: state.vertices[0], end: state.vertices[1] };
      this.updateClosingRightAngleIndicator(
        state,
        closingPerpendicularSnap.firstVertex,
        closingPerpendicularSnap.firstSegmentBearing,
        closingBearing,
        firstSegment
      );
    } else {
      // Fallback to mouse distance
      const mouseDistance = turf.distance(
        from,
        turf.point([lngLat.lng, lngLat.lat]),
        { units: "kilometers" }
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        orthogonalMatch.bearing,
        { units: "kilometers" }
      );
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.removeGuideCircle(state);
  } else if (
    closingPerpendicularSnap !== null &&
    !usePointDirection &&
    !isOrthogonalSnap
  ) {
    // Closing perpendicular snap: find intersection where closing segment is perpendicular to first segment
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
      mouseBearing,
      perpLine
    );
    if (intersection) {
      previewVertex = intersection.coord;
      isClosingPerpendicularSnap = true;
      // Show right-angle indicator at first vertex
      const closingBearing = turf.bearing(
        turf.point(previewVertex),
        turf.point(closingPerpendicularSnap.firstVertex)
      );
      const firstSegment = { start: state.vertices[0], end: state.vertices[1] };
      this.updateClosingRightAngleIndicator(
        state,
        closingPerpendicularSnap.firstVertex,
        closingPerpendicularSnap.firstSegmentBearing,
        closingBearing,
        firstSegment
      );
    } else {
      // Fallback to mouse distance
      const mouseDistance = turf.distance(
        from,
        turf.point([lngLat.lng, lngLat.lat]),
        { units: "kilometers" }
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        bearingToUse,
        { units: "kilometers" }
      );
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.removeGuideCircle(state);
  } else if (orthogonalMatch !== null && snapInfo && snapInfo.type === "line") {
    // Priority 2 for length: Bearing snap + line nearby -> extend/shorten to intersection
    const intersection = calculateLineIntersection(
      lastVertex,
      bearingToUse,
      snapInfo.segment
    );
    if (intersection) {
      previewVertex = intersection.coord;
    } else {
      // Fallback to mouse distance if intersection fails
      const mouseDistance = turf.distance(
        from,
        turf.point([lngLat.lng, lngLat.lat]),
        { units: "kilometers" }
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        bearingToUse,
        { units: "kilometers" }
      );
      previewVertex = destinationPoint.geometry.coordinates;
    }
    this.removeGuideCircle(state);
  } else if (isParallelLineSnap && snapInfo && snapInfo.type === "line") {
    // Parallel line snap + nearby line -> extend/shorten to intersection
    const intersection = calculateLineIntersection(
      lastVertex,
      bearingToUse,
      snapInfo.segment
    );
    if (intersection) {
      previewVertex = intersection.coord;
    } else {
      // Fallback to mouse distance if intersection fails
      const mouseDistance = turf.distance(
        from,
        turf.point([lngLat.lng, lngLat.lat]),
        { units: "kilometers" }
      );
      const destinationPoint = turf.destination(
        from,
        mouseDistance,
        bearingToUse,
        { units: "kilometers" }
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
      { units: "kilometers" }
    );
    const destinationPoint = turf.destination(
      from,
      mouseDistance,
      bearingToUse,
      { units: "kilometers" }
    );
    previewVertex = destinationPoint.geometry.coordinates;
    this.removeGuideCircle(state);
  }

  // Show right-angle indicators based on snap state
  // Note: bothSnapsActive case already handles showing both indicators above
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
      perpSnap.coord[1] - lineStart.geometry.coordinates[1]
    ];
    const toLastVert = [
      lastVertPoint.geometry.coordinates[0] - lineStart.geometry.coordinates[0],
      lastVertPoint.geometry.coordinates[1] - lineStart.geometry.coordinates[1]
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
      flipInside
    );
  } else if (
    isOrthogonalSnap &&
    !usePointDirection &&
    orthogonalMatch &&
    !bothSnapsActive
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
        orthogonalMatch.referenceSegment
      );
      this.removeCollinearSnapLine(state);
    }
  } else if (!isClosingPerpendicularSnap && !bothSnapsActive) {
    this.removeRightAngleIndicator(state);
    this.removeCollinearSnapLine(state);
  }

  // Handle closing indicator separately
  if (!isClosingPerpendicularSnap && !bothSnapsActive) {
    this.removeClosingRightAngleIndicator(state);
  }

  // Show parallel line indicators
  if (isParallelLineSnap && state.parallelLineSnap) {
    this.updateParallelLineIndicators(
      state,
      lastVertex,
      previewVertex,
      state.parallelLineSnap.matchedLine
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
      { lng: snapInfo.coord[0], lat: snapInfo.coord[1] }
    );
    if (underlyingLineInfo && underlyingLineInfo.segment) {
      this.updateLineSegmentSplitLabels(
        state,
        underlyingLineInfo.segment,
        snapInfo.coord
      );
    } else {
      this.removeLineSegmentSplitLabels(state);
    }
  } else {
    this.removeLineSegmentSplitLabels(state);
  }

  // Store preview vertex in state so it can be used in clickOnMap
  state.previewVertex = previewVertex;

  // Show preview point when snapping to something OR when orthogonal/parallel snap is active
  if (snapInfo || isOrthogonalSnap || isParallelLineSnap) {
    this.updatePreviewPoint(state, previewVertex);
  } else {
    this.removePreviewPoint(state);
  }

  // Update line preview
  state.line.updateCoordinate(
    state.vertices.length,
    previewVertex[0],
    previewVertex[1]
  );
};

DrawLineStringDistance.updateDistanceLabel = function (
  state,
  startVertex,
  endVertex,
  distance
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
    { units: "kilometers" }
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

DrawLineStringDistance.removeDistanceLabel = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("distance-label-text")) {
    map.removeLayer("distance-label-text");
  }
  if (map.getSource && map.getSource("distance-label-text")) {
    map.removeSource("distance-label-text");
  }
};

DrawLineStringDistance.updateLineSegmentSplitLabels = function (
  state,
  segment,
  snapPoint
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
    { units: "meters" }
  );
  const distance2 = turf.distance(
    turf.point(snapCoord),
    turf.point(segment.end),
    { units: "meters" }
  );

  const labelFeatures = [];

  // First sub-segment label (start to snap point)
  if (distance1 > 0.1) {
    // Only show if distance is meaningful
    const distanceText1 = `${distance1.toFixed(1)}m`;
    const midpoint1 = turf.midpoint(
      turf.point(segment.start),
      turf.point(snapCoord)
    );
    const bearing1 = turf.bearing(
      turf.point(segment.start),
      turf.point(snapCoord)
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
      { units: "kilometers" }
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
      turf.point(segment.end)
    );
    const bearing2 = turf.bearing(
      turf.point(snapCoord),
      turf.point(segment.end)
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
      { units: "kilometers" }
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

DrawLineStringDistance.removeLineSegmentSplitLabels = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("line-segment-split-labels")) {
    map.removeLayer("line-segment-split-labels");
  }
  if (map.getSource && map.getSource("line-segment-split-labels")) {
    map.removeSource("line-segment-split-labels");
  }
};

DrawLineStringDistance.updatePreviewPoint = function (state, coordinates) {
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

DrawLineStringDistance.removePreviewPoint = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("preview-point-indicator")) {
    map.removeLayer("preview-point-indicator");
  }
  if (map.getSource && map.getSource("preview-point-indicator")) {
    map.removeSource("preview-point-indicator");
  }
};

DrawLineStringDistance.updateGuideCircle = function (state, center, radius) {
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

DrawLineStringDistance.removeGuideCircle = function (state) {
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

DrawLineStringDistance.updateRightAngleIndicator = function (
  state,
  cornerVertex,
  referenceBearing,
  nextBearing,
  referenceSegment,
  flipInside = false
) {
  // Create L-shaped indicator that forms a square with the two line segments
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
    { units: "kilometers" }
  );

  // Point 2: The diagonal corner of the square
  const point2 = turf.destination(
    turf.point(point1.geometry.coordinates),
    2 / 1000,
    nextBearing + nextOffset,
    { units: "kilometers" }
  );

  // Point 3: along next segment
  const point3 = turf.destination(
    cornerPoint,
    2 / 1000,
    nextBearing + nextOffset,
    { units: "kilometers" }
  );

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

  state.rightAngleIndicator = indicatorFeature;

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
      paint: {
        "line-color": "#000000",
        "line-width": 1,
        "line-opacity": 1.0,
      },
    });
  } else {
    map.getSource("right-angle-indicator").setData(indicatorFeature);
  }
};

DrawLineStringDistance.removeRightAngleIndicator = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer("right-angle-indicator")) {
    map.removeLayer("right-angle-indicator");
  }
  if (map.getSource && map.getSource("right-angle-indicator")) {
    map.removeSource("right-angle-indicator");
  }
  state.rightAngleIndicator = null;
};

DrawLineStringDistance.updateClosingRightAngleIndicator = function (
  state,
  cornerVertex,
  referenceBearing,
  nextBearing,
  referenceSegment
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
    { units: "kilometers" }
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

DrawLineStringDistance.removeClosingRightAngleIndicator = function (state) {
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

DrawLineStringDistance.updateParallelLineIndicators = function (
  state,
  lastVertex,
  previewVertex,
  matchedLine
) {
  const map = this.map;
  if (!map) return;

  // Get the snap line segment
  const coords = [matchedLine.segment.start, matchedLine.segment.end];

  // Calculate bearing of the snap line
  const bearing = turf.bearing(
    turf.point(coords[0]),
    turf.point(coords[coords.length - 1])
  );

  // Extend the line 200m in both directions (same as extended guidelines)
  const extendedStart = turf.destination(
    turf.point(coords[0]),
    0.2,
    bearing + 180,
    { units: 'kilometers' }
  );
  const extendedEnd = turf.destination(
    turf.point(coords[coords.length - 1]),
    0.2,
    bearing,
    { units: 'kilometers' }
  );

  // Create extended line feature
  const extendedLineFeature = {
    type: 'Feature',
    properties: { isParallelExtendedLine: true },
    geometry: {
      type: 'LineString',
      coordinates: [
        extendedStart.geometry.coordinates,
        extendedEnd.geometry.coordinates
      ]
    }
  };

  // Calculate the orthogonal connector line from lastVertex to closest point on extended line
  const lastVertexPoint = turf.point(lastVertex);
  const extendedLine = turf.lineString([
    extendedStart.geometry.coordinates,
    extendedEnd.geometry.coordinates
  ]);
  const closestPoint = turf.nearestPointOnLine(extendedLine, lastVertexPoint);
  const connectorDistance = turf.distance(lastVertexPoint, closestPoint, { units: 'meters' });

  // Create orthogonal connector line feature
  const connectorLineFeature = {
    type: 'Feature',
    properties: { isOrthogonalConnector: true },
    geometry: {
      type: 'LineString',
      coordinates: [
        lastVertex,
        closestPoint.geometry.coordinates
      ]
    }
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
    { units: 'kilometers' }
  );

  // Create label feature with formatted distance
  const labelFeature = {
    type: 'Feature',
    properties: {
      distance: `${connectorDistance.toFixed(1)}m`,
      rotation: labelRotation
    },
    geometry: {
      type: 'Point',
      coordinates: offsetMidpoint.geometry.coordinates
    }
  };

  const featureCollection = {
    type: 'FeatureCollection',
    features: [extendedLineFeature, connectorLineFeature, labelFeature]
  };

  // Render extended line, connector line, and label
  if (!map.getSource('parallel-line-indicators')) {
    map.addSource('parallel-line-indicators', {
      type: 'geojson',
      data: featureCollection
    });

    // Add parallel extended line layer
    map.addLayer({
      id: 'parallel-line-indicators',
      type: 'line',
      source: 'parallel-line-indicators',
      filter: ['==', ['get', 'isParallelExtendedLine'], true],
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 0.3,
        'line-dasharray': [4, 4]
      }
    });

    // Add orthogonal connector line layer
    map.addLayer({
      id: 'parallel-line-indicators-connector',
      type: 'line',
      source: 'parallel-line-indicators',
      filter: ['==', ['get', 'isOrthogonalConnector'], true],
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 0.3,
        'line-dasharray': [4, 4]
      }
    });

    // Add label layer
    map.addLayer({
      id: 'parallel-line-indicators-label',
      type: 'symbol',
      source: 'parallel-line-indicators',
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
    map.getSource('parallel-line-indicators').setData(featureCollection);
  }
};

DrawLineStringDistance.removeParallelLineIndicators = function (state) {
  const map = this.map;
  if (!map) return;

  // Remove all layers
  if (map.getLayer && map.getLayer('parallel-line-indicators-label')) {
    map.removeLayer('parallel-line-indicators-label');
  }
  if (map.getLayer && map.getLayer('parallel-line-indicators-connector')) {
    map.removeLayer('parallel-line-indicators-connector');
  }
  if (map.getLayer && map.getLayer('parallel-line-indicators')) {
    map.removeLayer('parallel-line-indicators');
  }

  // Remove source
  if (map.getSource && map.getSource('parallel-line-indicators')) {
    map.removeSource('parallel-line-indicators');
  }
};

DrawLineStringDistance.updateCollinearSnapLine = function (
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

DrawLineStringDistance.removeCollinearSnapLine = function (state) {
  const map = this.map;
  if (!map) return;

  if (map.getLayer && map.getLayer('collinear-snap-line')) {
    map.removeLayer('collinear-snap-line');
  }
  if (map.getSource && map.getSource('collinear-snap-line')) {
    map.removeSource('collinear-snap-line');
  }
};

DrawLineStringDistance.onKeyUp = function (state, e) {
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
    if (state.vertices.length >= 2) {
      this.finishDrawing(state);
    }
  }

  // Escape key
  if (e.keyCode === 27 || CommonSelectors.isEscapeKey(e)) {
    if (state.vertices.length >= 2) {
      this.finishDrawing(state);
    } else {
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  }

  // Backspace
  if (e.keyCode === 8) {
    // Don't delete vertex if user is typing in distance or angle input
    if (state.distanceInput && state.distanceInput.value !== "") {
      return;
    }
    if (state.angleInput && state.angleInput.value !== "") {
      return;
    }
    // Also check if either input is focused (even if empty)
    if (document.activeElement === state.distanceInput || document.activeElement === state.angleInput) {
      return;
    }

    if (state.vertices.length > 1) {
      state.vertices.pop();
      state.line.removeCoordinate(state.vertices.length);
    } else if (state.vertices.length === 1) {
      state.vertices.pop();
      state.line.setCoordinates([]);
    }
  }
};

DrawLineStringDistance.finishDrawing = function (state) {
  if (state.vertices.length < 2) {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
    return;
  }

  state.line.setCoordinates(state.vertices);

  // Clean up indicators before finishing
  this.removeGuideCircle(state);
  this.removeRightAngleIndicator(state);
  this.removeClosingRightAngleIndicator(state);
  this.removeLineSegmentSplitLabels(state);
  this.removePreviewPoint(state);
  this.removeCollinearSnapLine(state);

  this.fire(Constants.events.CREATE, {
    features: [state.line.toGeoJSON()],
  });

  this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.line.id],
  });
};

DrawLineStringDistance.onStop = function (state) {
  doubleClickZoom.enable(this);
  this.activateUIButton();
  this.removeGuideCircle(state);
  this.removeDistanceLabel(state);
  this.removeLineSegmentSplitLabels(state);
  this.removePreviewPoint(state);

  // Clean up extended guidelines
  if (state.hoverDebounceTimer) {
    clearTimeout(state.hoverDebounceTimer);
    state.hoverDebounceTimer = null;
  }
  this.removeExtendedGuidelines(state);
  this.removeAngleReferenceLine();
  this.removeParallelLineIndicators(state);
  this.removeCollinearSnapLine(state);

  if (state.distanceContainer) {
    state.distanceContainer.remove();
    state.distanceContainer = null;
  }

  if (state.distanceKeyHandler) {
    document.removeEventListener("keydown", state.distanceKeyHandler);
    state.distanceKeyHandler = null;
  }

  if (state.angleKeyHandler) {
    document.removeEventListener("keydown", state.angleKeyHandler);
    state.angleKeyHandler = null;
  }

  state.distanceInput = null;
  state.angleInput = null;

  if (this.getFeature(state.line.id) === undefined) return;

  if (state.vertices.length < 2) {
    this.deleteFeature([state.line.id], { silent: true });
  }
};

DrawLineStringDistance.onTrash = function (state) {
  // Remove the last drawn vertex instead of deleting the entire feature
  if (state.vertices.length > 1) {
    state.vertices.pop();
    state.line.removeCoordinate(state.vertices.length);

    // Also remove the preview coordinate
    if (state.line.coordinates.length > state.vertices.length) {
      state.line.removeCoordinate(state.vertices.length);
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
  } else {
    // If only one or zero vertices, delete the feature and exit
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  }
};

DrawLineStringDistance.toDisplayFeatures = function (state, geojson, display) {
  const isActiveLine = geojson.properties.id === state.line.id;
  geojson.properties.active = isActiveLine
    ? Constants.activeStates.ACTIVE
    : Constants.activeStates.INACTIVE;

  if (!isActiveLine) return display(geojson);

  // Display vertices
  if (state.vertices.length > 0) {
    state.vertices.forEach((vertex, index) => {
      display({
        type: "Feature",
        properties: {
          meta: Constants.meta.VERTEX,
          parent: state.line.id,
          coord_path: String(index),
          active:
            index === state.vertices.length - 1
              ? Constants.activeStates.ACTIVE
              : Constants.activeStates.INACTIVE,
        },
        geometry: {
          type: "Point",
          coordinates: vertex,
        },
      });
    });
  }

  display(geojson);
};

DrawLineStringDistance.onTap = DrawLineStringDistance.onClick;

export default DrawLineStringDistance;
