# Implementation Plan: Select Modes Enhancement

**Date Created**: 2025-11-04
**Last Updated**: 2025-11-04
**Status**: ⏳ IN PROGRESS (0/7 completed)
**Total Tasks**: 7

## Overview

Enhance `simple_select.js` and `direct_select.js` modes with intelligent snapping and alignment features adapted from the distance drawing modes. The goal is to provide users with a professional CAD-like editing experience while maintaining the direct manipulation simplicity of the select modes.

### Goals

1. **Precision alignment** - Enable snapping for all feature types during movement
2. **Orthogonal guidance** - Help users maintain right angles when moving features/vertices
3. **Parallel consistency** - Allow alignment with nearby features
4. **Visual feedback** - Provide clear indicators of snapping behavior
5. **Non-intrusive** - Features should assist without interfering with basic operations

### Key Principles

- Maintain simplicity - No distance/angle input UI (that's for distance modes)
- Smart defaults - Features work automatically when appropriate
- Visual clarity - Users understand what's happening
- Backward compatible - Existing behavior preserved by default

---

## Task List

### Phase 1: Foundation (Highest Priority)
- [ ] **TASK-1**: Create shared snapping helper utilities
- [ ] **TASK-2**: Enhanced snapping for all feature types in Simple Select
- [ ] **TASK-3**: Enhanced vertex snapping in Direct Select

### Phase 2: Orthogonal Snapping (High Priority)
- [ ] **TASK-4**: Orthogonal movement snapping in Simple Select
- [ ] **TASK-5**: Orthogonal vertex snapping in Direct Select

### Phase 3: Parallel Snapping (Medium Priority)
- [ ] **TASK-6**: Parallel line snapping for both modes

### Phase 4: Visual Feedback (Lower Priority)
- [ ] **TASK-7**: Visual feedback system (reference lines and highlights)

---

## TASK-1: Create Shared Snapping Helper Utilities

**Category**: Infrastructure
**Priority**: Highest
**Estimated Effort**: Medium
**Dependencies**: None

### Current Problem

The distance modes contain sophisticated snapping logic that needs to be adapted for select modes. Rather than duplicating code, we need a shared utilities module.

### Proposed Solution

Create a new file `src/lib/select_mode_snapping.js` with simplified helper functions adapted from distance mode helpers.

### Files to Create

**New File**: `src/lib/select_mode_snapping.js`

**Functions to Include**:

```javascript
/**
 * Calculate orthogonal bearing relative to a reference bearing
 * Returns the closest orthogonal angle (0°, 90°, 180°, 270°) if within tolerance
 */
export function getOrthogonalBearing(referenceBearing, currentBearing, tolerance = 5)

/**
 * Resolve conflicts between orthogonal and parallel snapping
 * Returns which snap should win based on bearing comparison
 */
export function resolveSnapConflicts(orthogonalMatch, parallelLineMatch, mouseBearing)

/**
 * Show a reference line visualization on the map
 * Used to indicate the reference bearing for orthogonal snapping
 */
export function showReferenceLineVisualization(map, startPoint, bearing, lineId)

/**
 * Clear reference line visualization from the map
 */
export function clearReferenceLineVisualization(map, lineId)

/**
 * Calculate snap delta for moving features/vertices with snapping
 * Returns adjusted delta that accounts for snap coordinate
 */
export function calculateSnapDelta(originalPos, targetPos, snappedPos)
```

### Files to Modify

**Primary File**: `src/options.js`

Add configuration options:
```javascript
{
  // Simple select enhancements
  orthogonalMoveSnap: true,
  orthogonalMoveTolerance: 5,  // degrees
  parallelMoveSnap: true,
  parallelMoveTolerance: 5,  // degrees

  // Direct select enhancements
  orthogonalVertexSnap: true,
  orthogonalVertexTolerance: 5,  // degrees
  parallelVertexSnap: true,

  // Visual feedback
  showSnapReferenceLines: true,
  showSnapHighlights: true
}
```

### Implementation Steps

1. [ ] Create `src/lib/select_mode_snapping.js` file
2. [ ] Implement `getOrthogonalBearing()` - simplified from distance mode version
3. [ ] Implement `resolveSnapConflicts()` - adapted from `distance_mode_helpers.js`
4. [ ] Implement `showReferenceLineVisualization()` - adapted from distance modes
5. [ ] Implement `clearReferenceLineVisualization()` - cleanup function
6. [ ] Implement `calculateSnapDelta()` - new utility for select modes
7. [ ] Add JSDoc documentation for all functions
8. [ ] Add configuration options to `src/options.js`
9. [ ] Add JSDoc comments for new options
10. [ ] Create unit tests for helper functions (optional but recommended)

### Backward Compatibility

- All new options have sensible defaults
- Options default to `true` to enable features automatically
- Existing code without these options will behave as before
- No breaking changes to public API

### Testing Checklist

- [ ] Verify options are accessible via `ctx.options`
- [ ] Test `getOrthogonalBearing()` with various reference bearings
- [ ] Test tolerance parameter (2°, 5°, 10°)
- [ ] Test `resolveSnapConflicts()` with different scenarios
- [ ] Test visualization functions don't cause errors
- [ ] Verify helper functions can be imported by other modules

### Success Criteria

- [x] ✓ Shared utilities module created with all core functions
- [x] ✓ Configuration options added to options.js with defaults
- [x] ✓ All functions have comprehensive JSDoc documentation
- [x] ✓ Functions can be imported and used by select modes

---

## TASK-2: Enhanced Snapping for All Feature Types (Simple Select)

**Category**: Enhancement
**Priority**: High
**Estimated Effort**: Medium
**Dependencies**: TASK-1

### Current Problem

In `simple_select.js`, only Point features snap when dragged (line 265-267). LineStrings and Polygons use delta-based movement without snapping.

```javascript
// Current implementation (lines 259-277)
if (this.getSelected().length === 1 && this.getSelected()[0].type === 'Point') {
  lngLat = this._ctx.snapping.snapCoord(e.lngLat);
  this.getSelected()[0].incomingCoords([lngLat.lng, lngLat.lat])
} else {
  const delta = {
    lng: lngLat.lng - state.dragMoveLocation.lng,
    lat: lngLat.lat - state.dragMoveLocation.lat
  };
  moveFeatures(this.getSelected(), delta);
}
```

### Proposed Solution

Enable snapping for all feature types during single-feature drag operations.

### Files to Modify

**Primary File**: `src/modes/simple_select.js`

**Function to Modify**: `dragMove()` (lines 259-277)

### Implementation Details

```javascript
// Enhanced implementation
if (this.getSelected().length === 1) {
  const selected = this.getSelected()[0];
  const snappedLngLat = this._ctx.snapping.snapCoord(lngLat);

  if (selected.type === 'Point') {
    // Current behavior for points
    selected.incomingCoords([snappedLngLat.lng, snappedLngLat.lat]);
  } else {
    // NEW: Snap-aware delta for lines and polygons
    const snapDelta = {
      lng: snappedLngLat.lng - state.dragMoveLocation.lng,
      lat: snappedLngLat.lat - state.dragMoveLocation.lat
    };
    moveFeatures([selected], snapDelta);
  }
  state.dragMoveLocation = snappedLngLat;
} else {
  // Multi-selection: keep existing delta-based behavior
  const delta = {
    lng: lngLat.lng - state.dragMoveLocation.lng,
    lat: lngLat.lat - state.dragMoveLocation.lat
  };
  moveFeatures(this.getSelected(), delta);
  state.dragMoveLocation = lngLat;
}
```

### Implementation Steps

1. [ ] Import necessary helpers from `select_mode_snapping.js` (if needed)
2. [ ] Modify `dragMove()` function to apply snapping to all feature types
3. [ ] Test single Point drag (should work as before)
4. [ ] Test single LineString drag with snapping enabled
5. [ ] Test single Polygon drag with snapping enabled
6. [ ] Test multi-selection drag (should not snap - keep smooth behavior)
7. [ ] Verify snapping works with configured snap layers
8. [ ] Test with snap layers disabled (should work normally)

### Backward Compatibility

- Existing point snapping behavior unchanged
- Multi-selection behavior unchanged (no snapping)
- Only adds snapping to single LineString/Polygon drag
- No API changes

### Testing Checklist

**Single Feature Snapping:**
- [ ] Drag Point near snap feature → should snap
- [ ] Drag LineString near snap feature → should snap
- [ ] Drag Polygon near snap feature → should snap
- [ ] Verify snapped position matches visual indicator
- [ ] Test with different snap layers (lines, points, polygons)

**Multi-Selection:**
- [ ] Drag multiple features → should NOT snap (smooth movement)
- [ ] Verify multi-selection maintains current behavior

**Edge Cases:**
- [ ] Drag feature with no snap layers configured
- [ ] Drag feature outside snap tolerance
- [ ] Drag feature with snapping disabled
- [ ] Test at various zoom levels (10, 14, 18)

### Success Criteria

- [x] ✓ Single Points snap when dragged (existing behavior maintained)
- [x] ✓ Single LineStrings snap when dragged (new behavior)
- [x] ✓ Single Polygons snap when dragged (new behavior)
- [x] ✓ Multi-selection does NOT snap (existing behavior maintained)
- [x] ✓ No regression in existing drag functionality
- [x] ✓ Snapping respects snap layers and tolerance settings

---

## TASK-3: Enhanced Vertex Snapping (Direct Select)

**Category**: Enhancement
**Priority**: High
**Estimated Effort**: Medium
**Dependencies**: TASK-1

### Current Problem

In `direct_select.js`, only single vertex selection snaps (lines 225-229). Multi-vertex selection uses unconstrained delta movement without snapping.

```javascript
// Current implementation (lines 219-241)
if (state.selectedCoordPaths.length === 1) {
  lngLat = this._ctx.snapping.snapCoord(e.lngLat);
  // snapped version...
  state.feature.updateCoordinate(state.selectedCoordPaths[0], lngLat.lng, lngLat.lat);
} else {
  const delta = {
    lng: lngLat.lng - state.dragMoveLocation.lng,
    lat: lngLat.lat - state.dragMoveLocation.lat
  };

  if (state.selectedCoordPaths.length > 0) this.dragVertex(state, e, delta);
  else this.dragFeature(state, e, delta);
}
```

### Proposed Solution

Apply snapped delta to multi-vertex selections, enabling precise alignment when moving multiple vertices.

### Files to Modify

**Primary File**: `src/modes/direct_select.js`

**Function to Modify**: `onDrag()` (lines 219-241)

### Implementation Details

```javascript
// Enhanced implementation
let lngLat = e.lngLat;
const snappedLngLat = this._ctx.snapping.snapCoord(lngLat);

if (state.selectedCoordPaths.length === 1) {
  // Single vertex: direct snap (existing behavior)
  state.feature.updateCoordinate(state.selectedCoordPaths[0], snappedLngLat.lng, snappedLngLat.lat);
  state.dragMoveLocation = snappedLngLat;
} else if (state.selectedCoordPaths.length > 1) {
  // NEW: Multi-vertex with snapped delta
  const snapDelta = {
    lng: snappedLngLat.lng - state.dragMoveLocation.lng,
    lat: snappedLngLat.lat - state.dragMoveLocation.lat
  };
  this.dragVertex(state, e, snapDelta);
  state.dragMoveLocation = snappedLngLat;
} else {
  // No vertices selected: drag entire feature
  const delta = {
    lng: snappedLngLat.lng - state.dragMoveLocation.lng,
    lat: snappedLngLat.lat - state.dragMoveLocation.lat
  };
  this.dragFeature(state, e, delta);
  state.dragMoveLocation = snappedLngLat;
}
```

### Implementation Steps

1. [ ] Import necessary helpers from `select_mode_snapping.js`
2. [ ] Modify `onDrag()` function to apply snapping to all vertex operations
3. [ ] Test single vertex drag (should work as before)
4. [ ] Test multi-vertex drag with snapping
5. [ ] Test dragging entire feature in direct select mode
6. [ ] Verify snapping works with configured snap layers
7. [ ] Test with snap layers disabled

### Backward Compatibility

- Single vertex snapping behavior unchanged
- Entire feature drag gets snapping improvement
- Only adds snapping to multi-vertex drag
- No API changes

### Testing Checklist

**Single Vertex Snapping:**
- [ ] Drag single vertex near snap feature → should snap
- [ ] Verify behavior identical to current implementation

**Multi-Vertex Snapping:**
- [ ] Select 2 vertices, drag near snap feature → should snap
- [ ] Select 3+ vertices, drag near snap feature → should snap
- [ ] Verify all selected vertices move by the snapped delta
- [ ] Verify relative positions between vertices maintained

**Entire Feature Drag:**
- [ ] Click on feature (no vertices selected), drag → should snap
- [ ] Verify feature moves as a unit

**Edge Cases:**
- [ ] Drag vertices with no snap layers
- [ ] Drag vertices outside snap tolerance
- [ ] Drag vertices at different zoom levels
- [ ] Test with LineString and Polygon features

### Success Criteria

- [x] ✓ Single vertex snapping works as before (no regression)
- [x] ✓ Multi-vertex drag applies snapped delta (new behavior)
- [x] ✓ Entire feature drag in direct_select mode uses snapping (improved)
- [x] ✓ Relative vertex positions maintained during multi-drag
- [x] ✓ No regression in existing direct select functionality

---

## TASK-4: Orthogonal Movement Snapping (Simple Select)

**Category**: Enhancement
**Priority**: High
**Estimated Effort**: High
**Dependencies**: TASK-1, TASK-2

### Current Problem

When dragging features in simple_select mode, there's no guidance for maintaining perpendicular or parallel angles relative to nearby features. Users must manually align features at right angles.

### Proposed Solution

Add orthogonal snapping during feature drag operations. When user drags a feature and the movement bearing is close to perpendicular/parallel (±5°) relative to a nearby snapped line, snap the movement to that exact orthogonal angle.

### Files to Modify

**Primary File**: `src/modes/simple_select.js`

**Functions to Modify**:
- `onSetup()` - Add state properties for orthogonal snapping
- `startOnActiveFeature()` - Detect reference bearing on drag start
- `dragMove()` - Apply orthogonal bearing during drag
- `onMouseUp()` / `onTouchEnd()` - Clear reference visualization

### State Properties to Add

```javascript
// In onSetup state object
{
  // Existing properties...
  dragMoveLocation: null,
  canDragMove: false,
  // NEW: Orthogonal snapping state
  movementReferenceBearing: null,      // Bearing from nearby line
  movementReferenceSegment: null,      // Segment being used as reference
  movementStartPosition: null,         // Where drag started
  showingReferenceLine: false          // Visual feedback active
}
```

### Implementation Details

**1. Detect Reference Bearing on Drag Start**

In `startOnActiveFeature()` (called from `onMouseDown`):
```javascript
// After setting up drag state
state.movementStartPosition = e.lngLat;

// Check if we're near a snappable line
const snapping = this._ctx.snapping;
if (snapping && snapping.snappedGeometry) {
  const geom = snapping.snappedGeometry;
  if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
    // Extract bearing from snapped line using helper
    const bearingInfo = getSnappedLineBearing(this._ctx, e.lngLat);
    if (bearingInfo) {
      state.movementReferenceBearing = bearingInfo.bearing;
      state.movementReferenceSegment = bearingInfo.segment;
    }
  }
}
```

**2. Apply Orthogonal Bearing During Drag**

In `dragMove()` after snapping is applied:
```javascript
// After getting snappedLngLat
if (state.movementReferenceBearing !== null && this._ctx.options.orthogonalMoveSnap) {
  // Calculate current bearing from start position
  const from = turf.point([state.movementStartPosition.lng, state.movementStartPosition.lat]);
  const to = turf.point([snappedLngLat.lng, snappedLngLat.lat]);
  const currentBearing = turf.bearing(from, to);

  // Check if close to orthogonal angle
  const orthogonalMatch = getOrthogonalBearing(
    state.movementReferenceBearing,
    currentBearing,
    this._ctx.options.orthogonalMoveTolerance
  );

  if (orthogonalMatch) {
    // Snap movement to orthogonal bearing
    const distance = turf.distance(from, to, { units: 'meters' });
    const orthogonalPoint = turf.destination(from, distance / 1000, orthogonalMatch.bearing, { units: 'kilometers' });
    snappedLngLat = {
      lng: orthogonalPoint.geometry.coordinates[0],
      lat: orthogonalPoint.geometry.coordinates[1]
    };

    // Show reference line visualization
    if (this._ctx.options.showSnapReferenceLines && !state.showingReferenceLine) {
      showReferenceLineVisualization(
        this.map,
        [state.movementStartPosition.lng, state.movementStartPosition.lat],
        state.movementReferenceBearing,
        'simple-select-reference'
      );
      state.showingReferenceLine = true;
    }
  }
}

// Continue with normal drag logic using potentially adjusted snappedLngLat
```

**3. Clear Visualization on Drag End**

In `onMouseUp()` / `onTouchEnd()`:
```javascript
// After fireUpdate()
if (state.showingReferenceLine) {
  clearReferenceLineVisualization(this.map, 'simple-select-reference');
  state.showingReferenceLine = false;
}
state.movementReferenceBearing = null;
state.movementReferenceSegment = null;
state.movementStartPosition = null;
```

### Implementation Steps

1. [ ] Add new state properties to `onSetup()`
2. [ ] Import required helpers from `select_mode_snapping.js` and `distance_mode_helpers.js`
3. [ ] Implement reference bearing detection in `startOnActiveFeature()`
4. [ ] Implement orthogonal bearing calculation in `dragMove()`
5. [ ] Implement reference line visualization (show on snap)
6. [ ] Implement cleanup in `onMouseUp()` / `onTouchEnd()`
7. [ ] Test with horizontal line reference (bearing ~90°)
8. [ ] Test with vertical line reference (bearing ~0°)
9. [ ] Test with diagonal line reference (bearing ~45°)
10. [ ] Test visual feedback appears and clears correctly

### Backward Compatibility

- Only active when `orthogonalMoveSnap: true` (default)
- Can be disabled via options
- No changes to non-orthogonal dragging behavior
- No API changes

### Testing Checklist

**Basic Orthogonal Snapping:**
- [ ] Drag feature near horizontal line → test perpendicular (0°, 180°) and parallel (90°, 270°)
- [ ] Drag feature near vertical line → test perpendicular (90°, 270°) and parallel (0°, 180°)
- [ ] Drag feature near diagonal line (45°) → test all four orthogonal angles
- [ ] Verify snap activates within tolerance (5°)
- [ ] Verify snap doesn't activate outside tolerance

**Visual Feedback:**
- [ ] Verify reference line appears when orthogonal snap active
- [ ] Verify reference line is blue/dashed (distinct styling)
- [ ] Verify reference line extends from start position along reference bearing
- [ ] Verify reference line clears on drag end

**Configuration:**
- [ ] Test with `orthogonalMoveSnap: false` → should not snap
- [ ] Test with custom tolerance (`orthogonalMoveTolerance: 10`) → should snap with wider tolerance
- [ ] Test with `showSnapReferenceLines: false` → should snap but not show visual

**Edge Cases:**
- [ ] Drag feature not near any snappable lines → should work normally
- [ ] Drag with no snap layers configured → should work normally
- [ ] Drag short distance (< 1 meter) → should handle gracefully
- [ ] Quick drag-release → should cleanup properly

### Success Criteria

- [x] ✓ Orthogonal movement snapping works for single-feature drag
- [x] ✓ Reference bearing detected from nearby lines on drag start
- [x] ✓ Movement snaps to 0°, 90°, 180°, 270° relative to reference
- [x] ✓ Visual feedback shows reference line when snap active
- [x] ✓ Configuration options control behavior
- [x] ✓ Cleanup properly on drag end (no visual artifacts)

---

## TASK-5: Orthogonal Vertex Snapping (Direct Select)

**Category**: Enhancement
**Priority**: High
**Estimated Effort**: High
**Dependencies**: TASK-1, TASK-3

### Current Problem

When dragging vertices in direct_select mode, there's no guidance for maintaining perpendicular or parallel angles relative to adjacent segments or underlying features. Users must manually align vertices at right angles.

### Proposed Solution

Add orthogonal vertex snapping. When dragging a vertex, calculate reference bearings from:
1. **Adjacent segments** - Previous segment (i-1 → i) and next segment (i → i+1)
2. **Underlying lines** - Lines that the vertex sits on (detected via buffer layers)

If vertex movement bearing is close to orthogonal angles (±5°) relative to these references, snap to exact orthogonal bearing.

### Files to Modify

**Primary File**: `src/modes/direct_select.js`

**Functions to Modify**:
- `onSetup()` - Add state properties
- `onVertex()` / `onMidpoint()` - Detect reference bearings on drag start
- `onDrag()` - Apply orthogonal bearing during vertex drag
- `onMouseUp()` / `onTouchEnd()` - Clear visualizations

### State Properties to Add

```javascript
// In onSetup state object
{
  // Existing properties...
  selectedCoordPaths: [],
  dragMoveLocation: null,
  // NEW: Orthogonal vertex snapping state
  vertexReferenceBearings: [],         // Array of reference bearings
  vertexReferenceSegments: [],         // Corresponding segments
  vertexStartPosition: null,           // Where vertex drag started
  showingReferenceLine: false          // Visual feedback active
}
```

### Implementation Details

**1. Detect Reference Bearings on Vertex Drag Start**

In `onVertex()` and `onMidpoint()` (after `startDragging()`):
```javascript
// Store start position
state.vertexStartPosition = e.lngLat;
state.vertexReferenceBearings = [];
state.vertexReferenceSegments = [];

if (this._ctx.options.orthogonalVertexSnap) {
  const coordPath = about.coord_path;
  const coords = state.feature.coordinates;

  // Parse coord path to get vertex index
  const indices = coordPath.split('.').map(Number);
  const vertexIndex = indices[indices.length - 1];

  // Get flat coordinate array (handle both LineString and Polygon)
  let flatCoords = coords;
  if (state.feature.type === 'Polygon') {
    flatCoords = coords[0]; // Outer ring
  }

  // Check previous segment (if exists)
  if (vertexIndex > 0) {
    const prevVertex = flatCoords[vertexIndex - 1];
    const currentVertex = flatCoords[vertexIndex];
    const bearing = turf.bearing(turf.point(prevVertex), turf.point(currentVertex));
    state.vertexReferenceBearings.push(bearing);
    state.vertexReferenceSegments.push({ start: prevVertex, end: currentVertex });
  }

  // Check next segment (if exists)
  if (vertexIndex < flatCoords.length - 1) {
    const currentVertex = flatCoords[vertexIndex];
    const nextVertex = flatCoords[vertexIndex + 1];
    const bearing = turf.bearing(turf.point(currentVertex), turf.point(nextVertex));
    state.vertexReferenceBearings.push(bearing);
    state.vertexReferenceSegments.push({ start: currentVertex, end: nextVertex });
  }

  // Check for underlying line bearing
  const underlyingBearing = getUnderlyingLineBearing(this._ctx, this.map, e, e.lngLat);
  if (underlyingBearing) {
    state.vertexReferenceBearings.push(underlyingBearing.bearing);
    state.vertexReferenceSegments.push(underlyingBearing.segment);
  }
}
```

**2. Apply Orthogonal Bearing During Vertex Drag**

In `onDrag()` for single vertex case:
```javascript
if (state.selectedCoordPaths.length === 1) {
  let finalLngLat = this._ctx.snapping.snapCoord(e.lngLat);

  // Apply orthogonal snapping
  if (state.vertexReferenceBearings.length > 0 && this._ctx.options.orthogonalVertexSnap) {
    const from = turf.point([state.vertexStartPosition.lng, state.vertexStartPosition.lat]);
    const to = turf.point([finalLngLat.lng, finalLngLat.lat]);
    const currentBearing = turf.bearing(from, to);

    let bestMatch = null;
    let bestDiff = Infinity;

    // Check each reference bearing for orthogonal match
    for (const refBearing of state.vertexReferenceBearings) {
      const orthMatch = getOrthogonalBearing(
        refBearing,
        currentBearing,
        this._ctx.options.orthogonalVertexTolerance
      );

      if (orthMatch) {
        const diff = Math.abs(orthMatch.bearing - currentBearing);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestMatch = orthMatch;
        }
      }
    }

    if (bestMatch) {
      // Snap to orthogonal bearing
      const distance = turf.distance(from, to, { units: 'meters' });
      const orthogonalPoint = turf.destination(
        from,
        distance / 1000,
        bestMatch.bearing,
        { units: 'kilometers' }
      );
      finalLngLat = {
        lng: orthogonalPoint.geometry.coordinates[0],
        lat: orthogonalPoint.geometry.coordinates[1]
      };

      // Show reference line
      if (this._ctx.options.showSnapReferenceLines && !state.showingReferenceLine) {
        showReferenceLineVisualization(
          this.map,
          [state.vertexStartPosition.lng, state.vertexStartPosition.lat],
          bestMatch.referenceBearing,
          'direct-select-reference'
        );
        state.showingReferenceLine = true;
      }
    }
  }

  // Update vertex position
  state.feature.updateCoordinate(state.selectedCoordPaths[0], finalLngLat.lng, finalLngLat.lat);
  state.dragMoveLocation = finalLngLat;
}
```

**3. Clear on Drag End**

In `onMouseUp()` / `onTouchEnd()`:
```javascript
if (state.showingReferenceLine) {
  clearReferenceLineVisualization(this.map, 'direct-select-reference');
  state.showingReferenceLine = false;
}
state.vertexReferenceBearings = [];
state.vertexReferenceSegments = [];
state.vertexStartPosition = null;
```

### Implementation Steps

1. [ ] Add new state properties to `onSetup()`
2. [ ] Import required helpers
3. [ ] Implement reference bearing detection in `onVertex()`
4. [ ] Implement reference bearing detection in `onMidpoint()`
5. [ ] Handle coordinate path parsing for LineString and Polygon
6. [ ] Implement orthogonal bearing calculation in `onDrag()`
7. [ ] Implement reference line visualization
8. [ ] Implement cleanup in `onMouseUp()` / `onTouchEnd()`
9. [ ] Test with vertices that have adjacent segments
10. [ ] Test with vertices on underlying lines
11. [ ] Test with vertices at feature endpoints (only one adjacent segment)

### Backward Compatibility

- Only active when `orthogonalVertexSnap: true` (default)
- Can be disabled via options
- No changes to non-orthogonal vertex dragging
- No API changes

### Testing Checklist

**Adjacent Segment Snapping:**
- [ ] Drag middle vertex of LineString → should snap perpendicular/parallel to both adjacent segments
- [ ] Drag first vertex of LineString → should snap relative to next segment only
- [ ] Drag last vertex of LineString → should snap relative to previous segment only
- [ ] Drag vertex of Polygon → should snap relative to both adjacent segments

**Underlying Line Detection:**
- [ ] Place vertex on a snap line, drag → should detect underlying line bearing
- [ ] Drag vertex to create right angle with underlying line
- [ ] Test with vertex on LineString snap layer
- [ ] Test with vertex on Polygon edge (converted to LineString)

**Multi-Reference Priority:**
- [ ] Vertex with 2 adjacent segments + underlying line → should use closest match
- [ ] Verify best match selected based on current bearing

**Visual Feedback:**
- [ ] Reference line appears when orthogonal snap active
- [ ] Reference line shows the reference bearing being used
- [ ] Reference line clears on drag end

**Configuration:**
- [ ] Test with `orthogonalVertexSnap: false` → should not snap
- [ ] Test with custom tolerance → should respect tolerance setting
- [ ] Test with `showSnapReferenceLines: false` → should snap without visual

**Edge Cases:**
- [ ] Drag vertex of two-point LineString → limited references
- [ ] Drag vertex very short distance → should handle gracefully
- [ ] Multi-vertex selection → should use delta (orthogonal may not apply here)

### Success Criteria

- [x] ✓ Orthogonal vertex snapping works for single vertex drag
- [x] ✓ Reference bearings detected from adjacent segments
- [x] ✓ Reference bearings detected from underlying lines
- [x] ✓ Best orthogonal match selected when multiple references exist
- [x] ✓ Visual feedback shows reference line
- [x] ✓ Configuration options control behavior
- [x] ✓ Works with both LineString and Polygon features

---

## TASK-6: Parallel Line Snapping (Both Modes)

**Category**: Enhancement
**Priority**: Medium
**Estimated Effort**: High
**Dependencies**: TASK-1, TASK-2, TASK-3, TASK-4, TASK-5

### Current Problem

Users cannot easily maintain parallel alignment with nearby features when moving features or vertices. This is important for maintaining consistent angles across related geometries (e.g., parallel streets, building edges).

### Proposed Solution

Add parallel line snapping to both simple_select and direct_select modes. During drag operations, detect nearby lines that could serve as parallel references and snap the movement bearing to match them.

### Files to Modify

**Primary Files**:
1. `src/modes/simple_select.js` - For feature movement
2. `src/modes/direct_select.js` - For vertex movement

**Functions to Modify**:
- `dragMove()` in simple_select
- `onDrag()` in direct_select

### Implementation Details

**Parallel Line Detection:**

Use adapted version of `findNearbyParallelLines()` from distance_mode_helpers.js. For select modes:
- Calculate midpoint of movement vector (start → current position)
- Create orthogonal search line from midpoint
- Query snap layers for intersecting lines
- Return closest intersecting line as parallel reference

**For Simple Select (Feature Movement):**

```javascript
// In dragMove() after orthogonal snapping logic
if (this._ctx.options.parallelMoveSnap && state.movementStartPosition) {
  const lastVertex = [state.movementStartPosition.lng, state.movementStartPosition.lat];
  const currentPosition = { lng: snappedLngLat.lng, lat: snappedLngLat.lat };

  // Find nearby parallel lines
  const nearbyLines = findNearbyParallelLines(this._ctx, this.map, lastVertex, currentPosition);

  if (nearbyLines.length > 0) {
    // Calculate current movement bearing
    const from = turf.point(lastVertex);
    const to = turf.point([currentPosition.lng, currentPosition.lat]);
    const movementBearing = turf.bearing(from, to);

    // Check if close to any parallel line bearing
    const parallelMatch = getParallelBearing(
      nearbyLines,
      movementBearing,
      this._ctx.options.parallelMoveTolerance
    );

    if (parallelMatch) {
      // Resolve conflict if both orthogonal and parallel are active
      let finalOrthogonalMatch = orthogonalMatch;  // from earlier logic
      let finalParallelMatch = parallelMatch;

      if (orthogonalMatch && parallelMatch) {
        const resolved = resolveSnapConflicts(
          orthogonalMatch,
          parallelMatch,
          movementBearing
        );
        finalOrthogonalMatch = resolved.orthogonalMatch;
        finalParallelMatch = resolved.parallelLineMatch;
      }

      // If parallel wins, apply parallel bearing
      if (finalParallelMatch) {
        const distance = turf.distance(from, to, { units: 'meters' });
        const parallelPoint = turf.destination(
          from,
          distance / 1000,
          finalParallelMatch.bearing,
          { units: 'kilometers' }
        );
        snappedLngLat = {
          lng: parallelPoint.geometry.coordinates[0],
          lat: parallelPoint.geometry.coordinates[1]
        };

        // TODO: Show parallel line visualization
      }
    }
  }
}
```

**For Direct Select (Vertex Movement):**

Similar logic but applied to vertex drag in `onDrag()`:
- Use vertex start position and current position to define movement vector
- Find nearby parallel lines
- Apply parallel bearing if match found
- Resolve conflicts with orthogonal snapping

### Implementation Steps

1. [ ] Import `findNearbyParallelLines` and `getParallelBearing` from distance_mode_helpers
2. [ ] Implement parallel line detection in simple_select `dragMove()`
3. [ ] Implement conflict resolution between orthogonal and parallel in simple_select
4. [ ] Test feature movement with parallel snapping
5. [ ] Implement parallel line detection in direct_select `onDrag()`
6. [ ] Implement conflict resolution in direct_select
7. [ ] Test vertex movement with parallel snapping
8. [ ] Add visual feedback for parallel reference line (optional)
9. [ ] Test performance with many snap features
10. [ ] Verify spatial bounding box optimization works

### Backward Compatibility

- Only active when `parallelMoveSnap: true` / `parallelVertexSnap: true` (default)
- Can be disabled via options
- No changes to non-parallel dragging behavior
- No API changes

### Testing Checklist

**Simple Select - Parallel Feature Movement:**
- [ ] Drag LineString parallel to nearby line → should maintain parallel bearing
- [ ] Test with nearby line at various orientations (0°, 45°, 90°)
- [ ] Verify parallel snap activates within tolerance (5°)
- [ ] Verify parallel snap doesn't interfere with perpendicular movements

**Direct Select - Parallel Vertex Movement:**
- [ ] Drag vertex to keep segment parallel to nearby line
- [ ] Test with various line orientations
- [ ] Verify works for both LineString and Polygon vertices

**Conflict Resolution:**
- [ ] When both orthogonal and parallel snap active → verify correct priority
- [ ] Orthogonal to previous segment vs parallel to nearby line → test both win scenarios
- [ ] Verify smooth transition when moving in/out of tolerance

**Configuration:**
- [ ] Test with `parallelMoveSnap: false` → should not snap
- [ ] Test with custom tolerance → should respect setting
- [ ] Test with `parallelSnapSearchDistance` configured

**Performance:**
- [ ] Test with 50+ snap features in viewport → should remain responsive
- [ ] Verify bounding box optimization limits query scope
- [ ] No noticeable lag during drag operations

**Edge Cases:**
- [ ] No nearby parallel lines → should work normally
- [ ] Multiple parallel line candidates → should use closest
- [ ] Very short movement distance → should handle gracefully

### Success Criteria

- [x] ✓ Parallel line snapping works for feature movement (simple_select)
- [x] ✓ Parallel line snapping works for vertex movement (direct_select)
- [x] ✓ Conflicts between orthogonal and parallel resolved correctly
- [x] ✓ Configuration options control behavior
- [x] ✓ Performance remains good with many snap features
- [x] ✓ Visual feedback indicates parallel reference (if implemented)

---

## TASK-7: Visual Feedback System

**Category**: Enhancement
**Priority**: Lower
**Estimated Effort**: Medium
**Dependencies**: TASK-4, TASK-5, TASK-6

### Current Problem

Users need clear visual feedback to understand when orthogonal or parallel snapping is active and what reference features are being used.

### Proposed Solution

Implement comprehensive visual feedback system including:
1. **Reference lines** - Blue dashed lines showing reference bearings
2. **Snap highlights** - Highlight features being used as snap references
3. **Angle indicators** (optional) - Show angle values (90°, 180°, etc.)

### Files to Modify

**Primary Files**:
1. `src/lib/select_mode_snapping.js` - Visualization helper functions
2. `src/modes/simple_select.js` - Call visualization functions
3. `src/modes/direct_select.js` - Call visualization functions

**Supporting Files**:
- May need style layer definitions for reference lines

### Implementation Details

**1. Reference Line Visualization**

Already partially implemented in TASK-4 and TASK-5. Enhance with:
- Better styling (blue dashed line, good visibility)
- Extend line in both directions from start point
- Clear on any mode change or interaction end

**2. Snap Feature Highlighting**

Use existing `snap-hover` feature state from snapping system:
```javascript
// When orthogonal snap activates using a reference line
if (state.movementReferenceFeature) {
  this._ctx.snapping.setSnapHoverState(state.movementReferenceFeature, true);
}

// On drag end, clear highlight
if (state.movementReferenceFeature) {
  this._ctx.snapping.setSnapHoverState(state.movementReferenceFeature, false);
  state.movementReferenceFeature = null;
}
```

**3. Angle Indicators (Optional)**

Display angle value near the snap point:
```javascript
// Create temporary marker or label showing "90°" or "Parallel"
function showAngleIndicator(map, position, angle, type) {
  // Create DOM element or use map marker
  // Position near the snap point
  // Show angle value or text like "90°", "Parallel", etc.
}
```

### Implementation Steps

1. [ ] Review and enhance `showReferenceLineVisualization()` in select_mode_snapping.js
2. [ ] Ensure reference lines have good visibility (color, width, dash pattern)
3. [ ] Implement feature highlighting using `setSnapHoverState()`
4. [ ] Store reference to highlighted feature in state for cleanup
5. [ ] Clear highlights on drag end in both modes
6. [ ] (Optional) Implement angle indicator display
7. [ ] (Optional) Add configuration option to show/hide angle indicators
8. [ ] Test visual feedback at various zoom levels
9. [ ] Ensure no visual artifacts remain after drag operations
10. [ ] Verify performance with visualizations enabled

### Backward Compatibility

- Controlled by `showSnapReferenceLines` and `showSnapHighlights` options
- Can be disabled without affecting snap functionality
- No API changes

### Testing Checklist

**Reference Lines:**
- [ ] Reference line appears when orthogonal snap active
- [ ] Reference line visible at zoom levels 10, 14, 18
- [ ] Reference line extends in both directions from start point
- [ ] Reference line has distinct styling (blue dashed)
- [ ] Reference line clears on drag end
- [ ] Multiple drags don't leave artifacts

**Feature Highlights:**
- [ ] Snap reference feature highlights when used
- [ ] Highlight clears on drag end
- [ ] Highlight doesn't persist if drag is cancelled
- [ ] Works with different feature types (lines, polygons)

**Angle Indicators (if implemented):**
- [ ] Angle indicator shows correct value (0°, 90°, 180°, 270°)
- [ ] Positioned near snap point without obscuring map
- [ ] Updates during drag if angle changes
- [ ] Clears on drag end

**Configuration:**
- [ ] `showSnapReferenceLines: false` → no reference lines shown but snapping still works
- [ ] `showSnapHighlights: false` → no highlights but snapping still works
- [ ] Both disabled → pure functional snapping without visual feedback

**Performance:**
- [ ] No lag when visualizations update during drag
- [ ] Visualizations render smoothly
- [ ] No memory leaks from repeated drag operations

### Success Criteria

- [x] ✓ Reference lines clearly indicate snap behavior
- [x] ✓ Reference features highlighted during use
- [x] ✓ Visual feedback enhances user understanding
- [x] ✓ No visual artifacts after operations complete
- [x] ✓ Configuration options allow disabling visuals if desired
- [x] ✓ Performance remains good with visuals enabled

---

## Testing Strategy

### Unit Testing (Per Task)

Each task has specific testing checklist in its section. Complete these before moving to next task.

### Integration Testing (After All Tasks)

Once all tasks complete, perform comprehensive integration testing:

**Simple Select Mode:**
- [ ] Drag Point with all features enabled
- [ ] Drag LineString with all features enabled
- [ ] Drag Polygon with all features enabled
- [ ] Drag multiple features (should not snap, verify existing behavior)
- [ ] Test at zoom levels: 10, 14, 18
- [ ] Test with dense snap layers (100+ features)
- [ ] Test with no snap layers
- [ ] Verify visual feedback appears and clears correctly
- [ ] Verify orthogonal and parallel work together

**Direct Select Mode:**
- [ ] Drag single vertex with all features enabled
- [ ] Drag multiple vertices with all features enabled
- [ ] Drag entire feature in direct_select mode
- [ ] Test with LineString features
- [ ] Test with Polygon features
- [ ] Test vertex with adjacent segments
- [ ] Test vertex on underlying line
- [ ] Verify visual feedback works
- [ ] Verify orthogonal and parallel work together

**Mode Switching:**
- [ ] Switch from simple_select to direct_select → verify no state leakage
- [ ] Switch from direct_select to simple_select → verify cleanup
- [ ] Switch to draw modes and back → verify select modes still work

**Performance:**
- [ ] Drag operations remain smooth with 100+ snap features
- [ ] No noticeable lag during continuous drag
- [ ] Visual feedback renders without frame drops
- [ ] Memory usage stable during repeated operations

**Configuration:**
- [ ] Test with all features disabled → verify no snapping occurs
- [ ] Test with only orthogonal enabled
- [ ] Test with only parallel enabled
- [ ] Test with custom tolerances
- [ ] Test with visual feedback disabled

### Regression Testing

Verify no existing functionality broken:
- [ ] Basic feature selection works
- [ ] Basic feature dragging works (without snapping)
- [ ] Box selection works
- [ ] Delete features works
- [ ] Combine/uncombine features works
- [ ] Basic vertex editing works
- [ ] Add vertex (midpoint click) works
- [ ] Delete vertex works
- [ ] All draw modes still work
- [ ] Existing snapping system works

---

## Rollback Strategy

Each task should be implemented in its own git branch and/or clear commit(s). If any task causes issues:

### TASK-1 Rollback
- Revert commit that adds `select_mode_snapping.js`
- Revert commit that adds options to `options.js`
- No impact on existing functionality

### TASK-2 Rollback
- Revert commit that modifies `dragMove()` in simple_select
- LineStrings and Polygons return to delta-based movement without snapping
- Points still snap (existing behavior)

### TASK-3 Rollback
- Revert commit that modifies `onDrag()` in direct_select
- Multi-vertex drag returns to delta without snapping
- Single vertex still snaps (existing behavior)

### TASK-4 Rollback
- Revert commits that add orthogonal snapping to simple_select
- Feature dragging returns to regular snapping without orthogonal
- No functional impact, just removes orthogonal guidance

### TASK-5 Rollback
- Revert commits that add orthogonal snapping to direct_select
- Vertex dragging returns to regular snapping without orthogonal
- No functional impact

### TASK-6 Rollback
- Revert commits that add parallel snapping to both modes
- Returns to orthogonal-only snapping
- No functional impact

### TASK-7 Rollback
- Revert commits that add visual feedback
- Snapping still works, just without visual indicators
- No functional impact

---

## Implementation Order

**Recommended order**: TASK-1 → TASK-2 → TASK-3 → TASK-4 → TASK-5 → TASK-6 → TASK-7

**Rationale**:
1. **TASK-1 first** - Creates infrastructure needed by all other tasks
2. **TASK-2 & TASK-3** - Foundation snapping improvements, highest value
3. **TASK-4 & TASK-5** - Orthogonal snapping builds on foundation
4. **TASK-6** - Parallel snapping builds on orthogonal (needs conflict resolution)
5. **TASK-7 last** - Visual polish after all functionality complete

**Can be parallelized:**
- TASK-2 and TASK-3 can be done in parallel (different files)
- TASK-4 and TASK-5 can be done in parallel (different files)

**Dependencies to respect:**
- TASK-1 must complete before all others
- TASK-4/TASK-5 should complete before TASK-6 (for conflict resolution)
- TASK-7 should be last (depends on all functionality being in place)

---

## Success Criteria (Overall)

### Functional Requirements
- [x] ✓ All feature types (Point, LineString, Polygon) snap when dragged in simple_select
- [x] ✓ Single and multi-vertex selections snap in direct_select
- [x] ✓ Orthogonal snapping works for feature movement
- [x] ✓ Orthogonal snapping works for vertex movement
- [x] ✓ Parallel snapping works for both modes
- [x] ✓ Conflicts between orthogonal and parallel resolved intelligently
- [x] ✓ Visual feedback clearly indicates snap behavior

### Non-Functional Requirements
- [x] ✓ Performance remains good with 100+ snap features
- [x] ✓ No regressions in existing functionality
- [x] ✓ 100% backward compatible with default options
- [x] ✓ All features configurable via options
- [x] ✓ Clean code with proper documentation
- [x] ✓ Visual feedback has no artifacts

### User Experience
- [x] ✓ Features are discoverable (work automatically when appropriate)
- [x] ✓ Features are non-intrusive (don't interfere with basic operations)
- [x] ✓ Visual feedback helps users understand behavior
- [x] ✓ Snapping feels precise and responsive
- [x] ✓ Users can disable features if desired

---

## Notes

- This enhancement focuses on **intelligent assistance** during editing operations
- No distance/angle input UI (that's specific to distance drawing modes)
- Keep select modes focused on **direct manipulation** with **smart snapping**
- Visual feedback is key to user understanding and confidence
- All features should be configurable and disableable
- Maintain the simplicity and responsiveness of the select modes
- Test thoroughly at each phase before proceeding

---

## Future Enhancements (Out of Scope)

These features could be considered in future iterations:

- [ ] Snap to grid (configurable grid spacing)
- [ ] Snap to absolute angles (N/S/E/W regardless of reference features)
- [ ] Distance constraints during vertex drag (e.g., maintain edge length)
- [ ] Snap to polygon centers or bounding box corners
- [ ] Angle snap indicator with arc visualization
- [ ] Keyboard shortcuts to toggle snapping on/off (like Alt key)
- [ ] API methods to programmatically control snap behavior
- [ ] Save/load snap preferences per user
- [ ] Snap history/undo for snap-specific operations
