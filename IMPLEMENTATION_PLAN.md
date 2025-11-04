# Implementation Plan

**Date Created**: 2025-11-04
**Last Updated**: 2025-11-04
**Status**: Planning Phase
**Total Tasks**: 5

## Critical Requirements

- All changes must maintain backward compatibility
- Each task should be implemented and tested independently
- Existing functionality must not break after any change
- Test thoroughly before moving to next task

---

## Task List

### Parallel Line Snapping Improvements

- [ ] **TASK-1**: Add configurability options for snap tolerances and thresholds
- [ ] **TASK-2**: Extract conflict resolution logic to shared helper function
- [ ] **TASK-3**: Add performance optimization with spatial bounds for feature queries

### Additional Tasks

- [ ] **TASK-4**: Fix geometric precision issue with double orthogonal snap chaining
- [ ] **TASK-5**: Add configuration options for angle/distance input visibility and position

---

## TASK-1: Add Configurability Options

**Category**: Enhancement
**Priority**: High
**Estimated Effort**: Medium
**Dependencies**: None

### Current Problem
Multiple hardcoded values that users cannot adjust:
- Parallel snap bearing tolerance: ±5°
- BothSnapsActive proximity threshold: 5 meters
- Extended guideline extension distance: 200 meters (0.2 km)
- Orthogonal line search distance: 1 km
- Snap distance buffer: 20 pixels (from original snapping.js)

### Proposed Solution
Add new configuration options to the MapboxDraw initialization options, with sensible defaults that match current behavior.

### Files to Modify

**Primary File**: `src/options.js`

**New Options to Add**:
```javascript
{
  // Existing options...
  snapDistance: 20,  // Already exists

  // New options for parallel snap
  parallelSnapTolerance: 5,              // degrees ±
  parallelSnapProximityThreshold: 5,     // meters (for bothSnapsActive conflict)
  parallelSnapSearchDistance: 1,         // km (orthogonal line extension)
  extendedGuidelineDistance: 0.2,        // km (200 meters)

  // Future extensibility
  orthogonalSnapTolerance: 5,            // degrees ± (currently hardcoded)
}
```

**Secondary Files**:
1. `src/lib/distance_mode_helpers.js`:
   - Update `findNearbyParallelLines()` to use `ctx.options.parallelSnapSearchDistance`
   - Update `getParallelBearing()` to accept tolerance from options instead of hardcoded 5
   - Update any helper functions to use `ctx.options.parallelSnapProximityThreshold`

2. `src/modes/draw_line_string_distance.js`:
   - Update extended guideline extension to use `ctx.options.extendedGuidelineDistance`
   - Pass `ctx.options.parallelSnapTolerance` to `getParallelBearing()`

3. `src/modes/draw_polygon_distance.js`:
   - Same changes as draw_line_string_distance.js

### Implementation Steps

1. [ ] Add default values to `src/options.js`
2. [ ] Update `getParallelBearing()` signature to accept tolerance parameter
3. [ ] Update `findNearbyParallelLines()` to use `ctx.options.parallelSnapSearchDistance`
4. [ ] Update `draw_line_string_distance.js` to pass options to helpers
5. [ ] Update `draw_polygon_distance.js` to pass options to helpers
6. [ ] Update extended guideline extension logic in both modes
7. [ ] Test with default options (verify identical behavior)
8. [ ] Test with custom option values
9. [ ] Add JSDoc comments for new options
10. [ ] Update documentation

### Default Values Rationale
- `parallelSnapTolerance: 5` - Matches current orthogonal snap tolerance
- `parallelSnapProximityThreshold: 5` - Current hardcoded value, in meters
- `parallelSnapSearchDistance: 1` - Current hardcoded value, in km
- `extendedGuidelineDistance: 0.2` - Current hardcoded value (200m)

### Backward Compatibility
- All new options have defaults matching current hardcoded behavior
- Existing code without these options will behave identically
- Users can opt-in to customization by setting these options
- No breaking changes to public API

### Testing Checklist
- [ ] Test with default options (should behave exactly as current code)
- [ ] Test with custom `parallelSnapTolerance` (2°, 10°)
- [ ] Test with custom `parallelSnapProximityThreshold` (2m, 10m)
- [ ] Test with custom `parallelSnapSearchDistance` (0.5km, 2km)
- [ ] Test with custom `extendedGuidelineDistance` (0.1km, 0.5km)
- [ ] Test edge cases (0, negative values, very large values)
- [ ] Verify options are properly passed through ctx to all helper functions
- [ ] Test in both line string and polygon distance modes

### Success Criteria
- All 5 new options are configurable via MapboxDraw constructor
- Default values produce identical behavior to current code
- Custom values properly affect snap behavior
- Options are properly documented

---

## TASK-2: Extract Conflict Resolution Logic

**Category**: Refactoring
**Priority**: Medium
**Estimated Effort**: Medium
**Dependencies**: TASK-1 (recommended to do after configurability)

### Current Problem
The conflict resolution logic for orthogonal/parallel/bothSnapsActive is duplicated in 4 locations:
- `draw_line_string_distance.js` - `onMouseMove()` (lines ~1625-1705)
- `draw_line_string_distance.js` - `clickOnMap()` (lines ~1112-1192)
- `draw_polygon_distance.js` - `onMouseMove()` (lines ~1888-1968)
- `draw_polygon_distance.js` - `clickOnMap()` (lines ~1360-1440)

This creates maintenance burden and risk of inconsistency.

### Proposed Solution
Extract the conflict resolution logic into a shared helper function in `distance_mode_helpers.js`.

### Files to Modify

**Primary File**: `src/lib/distance_mode_helpers.js`

**New Function to Create**:
```javascript
/**
 * Resolves conflicts between orthogonal, parallel, and bothSnapsActive snapping
 * Returns which snap should win based on proximity and bearing comparison
 *
 * @param {Object} options
 * @param {Object|null} options.orthogonalMatch - Orthogonal snap match object
 * @param {Object|null} options.parallelLineMatch - Parallel line snap match object
 * @param {boolean} options.bothSnapsActive - Whether double orthogonal snap is active
 * @param {Array} options.lastVertex - Last vertex coordinate [lng, lat]
 * @param {Object} options.lngLat - Current mouse position {lng, lat}
 * @param {Object|null} options.closingPerpendicularSnap - Closing perpendicular snap object (for bothSnapsActive calculation)
 * @param {number} options.proximityThreshold - Distance threshold in meters for bothSnapsActive priority (default: 5)
 *
 * @returns {Object} { orthogonalMatch, parallelLineMatch } - One will be null based on conflict resolution
 */
export function resolveSnapConflicts(options) {
  // Implementation extracts duplicated logic
}
```

**Function Responsibilities**:
1. Check if bothSnapsActive && parallelLineMatch both exist
2. If yes, calculate intersection point and distance
3. If distance < threshold, nullify parallelLineMatch (bothSnapsActive wins)
4. If distance >= threshold, compare bearing differences (closest to mouse wins)
5. If no bothSnapsActive, do simple bearing comparison
6. Return modified { orthogonalMatch, parallelLineMatch }

**Secondary Files**:
- `src/modes/draw_line_string_distance.js` - 2 locations
- `src/modes/draw_polygon_distance.js` - 2 locations

### Implementation Steps

1. [ ] Create `resolveSnapConflicts()` function in `distance_mode_helpers.js`
2. [ ] Add comprehensive JSDoc documentation
3. [ ] Implement the conflict resolution logic (extract from existing code)
4. [ ] Replace code in `draw_line_string_distance.js` `onMouseMove()`
5. [ ] Test line string mode thoroughly (verify identical behavior)
6. [ ] Replace code in `draw_line_string_distance.js` `clickOnMap()`
7. [ ] Test line string mode again (both mouse move and click)
8. [ ] Replace code in `draw_polygon_distance.js` `onMouseMove()`
9. [ ] Test polygon mode thoroughly
10. [ ] Replace code in `draw_polygon_distance.js` `clickOnMap()`
11. [ ] Final comprehensive test of all modes

### Backward Compatibility
- Function should produce identical results to current inline logic
- No change to public API or user-facing behavior
- Purely internal refactoring
- All existing tests should pass without modification

### Testing Checklist
- [ ] Test orthogonalMatch only (no conflict)
- [ ] Test parallelLineMatch only (no conflict)
- [ ] Test both with bothSnapsActive + mouse distance < 5m (bothSnaps wins)
- [ ] Test both with bothSnapsActive + mouse distance > 5m (bearing comparison)
- [ ] Test both without bothSnapsActive (simple bearing comparison)
- [ ] Test in line string mode - onMouseMove
- [ ] Test in line string mode - clickOnMap
- [ ] Test in polygon mode - onMouseMove
- [ ] Test in polygon mode - clickOnMap
- [ ] Verify visual feedback is identical
- [ ] Verify vertex placement is identical

### Success Criteria
- All 4 locations use the same shared function
- Zero code duplication for conflict resolution logic
- Identical behavior to current implementation
- Code is more maintainable and testable

---

## TASK-3: Performance Optimization with Spatial Bounds

**Category**: Performance
**Priority**: Medium
**Estimated Effort**: Medium
**Dependencies**: TASK-1, TASK-2 (recommended to do last)

### Current Problem
`findNearbyParallelLines()` calls `map.queryRenderedFeatures({ layers: bufferLayers })` without spatial bounds, potentially querying thousands of features across the entire viewport on every mouse move.

This causes performance issues on:
- Dense maps with many snap layers
- Maps with many features in the viewport
- Every single mouse move event during drawing

### Proposed Solution
Add spatial bounds to the query based on a reasonable search radius around the midpoint of the line being drawn.

### Files to Modify

**Primary File**: `src/lib/distance_mode_helpers.js`

**Function to Modify**: `findNearbyParallelLines()` (lines ~450-520)

### Implementation Details

**Changes Required**:
1. Calculate a bounding box around the midpoint with a search radius
2. Use `map.project()` to convert geographic coordinates to pixel coordinates
3. Create a bounding box `[[x1, y1], [x2, y2]]` for the query
4. Pass this bounding box to `queryRenderedFeatures(bbox, { layers: bufferLayers })`

**Search Radius Consideration**:
- The orthogonal line extends using `parallelSnapSearchDistance` (default 1km)
- Need to query a box that encompasses this entire orthogonal line
- Proposed approach: Use `parallelSnapSearchDistance` from options to calculate bounds
- Add buffer to ensure we don't miss nearby features at edges

**Code Approach**:
```javascript
// Calculate bounding box in geographic coordinates
const searchRadius = ctx.options.parallelSnapSearchDistance; // km
const northPoint = turf.destination(midpoint, searchRadius, 0, { units: 'kilometers' });
const southPoint = turf.destination(midpoint, searchRadius, 180, { units: 'kilometers' });
const eastPoint = turf.destination(midpoint, searchRadius, 90, { units: 'kilometers' });
const westPoint = turf.destination(midpoint, searchRadius, 270, { units: 'kilometers' });

// Convert to pixel coordinates
const nwPixel = map.project([westPoint.geometry.coordinates[0], northPoint.geometry.coordinates[1]]);
const sePixel = map.project([eastPoint.geometry.coordinates[0], southPoint.geometry.coordinates[1]]);

// Create bounding box for query
const bbox = [[nwPixel.x, nwPixel.y], [sePixel.x, sePixel.y]];

// Query with bounds
const allFeatures = map.queryRenderedFeatures(bbox, { layers: bufferLayers });
```

### Implementation Steps

1. [ ] Add bounding box calculation to `findNearbyParallelLines()`
2. [ ] Use `ctx.options.parallelSnapSearchDistance` for radius
3. [ ] Convert geographic bounds to pixel coordinates
4. [ ] Update `queryRenderedFeatures()` call to include bbox
5. [ ] Test with dense maps (verify performance improvement)
6. [ ] Test with sparse maps (verify identical results)
7. [ ] Test at various zoom levels (close-up and zoomed-out)
8. [ ] Measure performance with console.time() before and after
9. [ ] Add comments explaining the bounding box calculation

### Backward Compatibility
- This is purely an optimization that limits the search space
- Will return the same results as before, just faster
- No API changes, no state changes, no visual changes
- May return slightly different results if features were at extreme edges, but this is acceptable

### Testing Checklist
- [ ] Test with map containing 100+ snap features in viewport
- [ ] Test with map containing few snap features
- [ ] Test at zoom level 10 (zoomed out)
- [ ] Test at zoom level 18 (zoomed in)
- [ ] Test at zoom level 14 (medium)
- [ ] Verify parallel snap still finds all relevant lines
- [ ] Verify no false negatives (missing lines that should be found)
- [ ] Measure query time with console.time() (should be faster)
- [ ] Test in both line string and polygon modes
- [ ] Verify visual feedback is unchanged

### Performance Measurement
Before implementing, measure baseline:
```javascript
console.time('parallelLineQuery');
const allFeatures = map.queryRenderedFeatures({ layers: bufferLayers });
console.timeEnd('parallelLineQuery');
```

After implementing, compare:
```javascript
console.time('parallelLineQuery');
const allFeatures = map.queryRenderedFeatures(bbox, { layers: bufferLayers });
console.timeEnd('parallelLineQuery');
```

Expected improvement: 50-90% reduction in query time on dense maps

### Success Criteria
- Feature queries execute measurably faster (console.time shows improvement)
- No change in snap behavior or accuracy
- Works correctly at all zoom levels
- No regressions in existing functionality

---

## TASK-4: Fix Geometric Precision Issue with Double Orthogonal Snap Chaining

**Category**: Bug Fix
**Priority**: Medium
**Estimated Effort**: Medium
**Dependencies**: None (can be done independently)

### Current Problem

When using the double orthogonal snap (bothSnapsActive - where a point is orthogonal to both the first segment and the last drawn segment), there is a geometric precision issue when chaining orthogonal snaps:

**Scenario:**
1. Draw first segment: vertex A → vertex B
2. Continue drawing and reach point P where bothSnapsActive triggers (orthogonal to both first segment A→B and last segment)
3. Click at point P to place vertex
4. From P, move cursor and snap orthogonally to the segment just drawn (ending at P)
5. **Expected**: This orthogonal bearing should land exactly on the first segment A→B (and continuing should reach vertex A exactly)
6. **Actual**: The orthogonal snap bearing is slightly off, missing vertex A by a few meters

**Geometric Principle:**
If point P is truly at 90° from both the first segment and the last segment, then moving 90° from the last segment should place you exactly back on line A→B. Any deviation indicates a bearing calculation inconsistency.

### Root Cause Analysis

Potential causes for the geometric drift:

1. **Floating-point precision**: Small errors in `turf.bearing()` calculations accumulating across multiple orthogonal transformations
2. **Bearing tolerance snapping**: The ±5° tolerance in `getOrthogonalBearing()` may cause bearings to snap to values that aren't exactly 90° from the reference
3. **Orthogonal bearing cache**: The `orthogonalBearingCache` might use different inputs/keys for the "next" orthogonal snap vs the one used to calculate point P
4. **Parallel snap interference**: If the first segment is a snap layer, parallel snap detection might slightly alter the bearing through conflict resolution
5. **Reference bearing inconsistency**: Different bearing calculations for bothSnapsActive vs subsequent orthogonal snaps

### Proposed Solution

Investigate and fix the bearing calculation precision issue:

1. **Add geometric validation**: When bothSnapsActive is used, store the exact bearings used for that intersection
2. **Ensure consistent bearing references**: Subsequent orthogonal snaps from a bothSnapsActive point should use consistent bearing calculations
3. **Improve floating-point handling**: Consider rounding/normalizing bearings at key points to prevent drift
4. **Add snap-to-vertex logic**: When an orthogonal snap comes within a threshold (e.g., 2 meters) of an existing vertex, snap exactly to that vertex
5. **Debug visualization**: Add temporary logging to trace bearing calculations through the chain

### Files to Modify

**Primary Files:**
1. `src/lib/distance_mode_helpers.js`:
   - `getOrthogonalBearing()` - May need precision improvements
   - Potentially add `normalizedBearing()` helper function

2. `src/modes/draw_line_string_distance.js`:
   - `onMouseMove()` - Orthogonal snap calculation
   - `clickOnMap()` - Verify consistent bearing use
   - May need to store additional state when bothSnapsActive is used

3. `src/modes/draw_polygon_distance.js`:
   - Same changes as line string mode (if issue exists in polygon mode)

### Implementation Steps

1. [ ] Add diagnostic logging to trace bearing calculations
   - Log bearings when bothSnapsActive intersection is calculated
   - Log bearings during subsequent orthogonal snaps
   - Log any bearing adjustments from tolerance snapping

2. [ ] Investigate orthogonal bearing cache behavior
   - Check if cache keys are consistent across snap chain
   - Verify cache isn't causing bearing drift

3. [ ] Test for parallel snap interference
   - Temporarily disable parallel snap and test if issue persists
   - If issue disappears, investigate conflict resolution bearing modifications

4. [ ] Implement precision improvements (based on findings):
   - Option A: Store reference bearing at bothSnapsActive point for subsequent use
   - Option B: Add bearing normalization to prevent floating-point drift
   - Option C: Add snap-to-vertex logic when orthogonal snap comes very close to existing vertex
   - Option D: Increase precision of bearing calculations at critical points

5. [ ] Add geometric validation test
   - Create test case: draw segment, trigger bothSnapsActive, continue orthogonally
   - Calculate expected vs actual position
   - Verify geometric consistency

6. [ ] Test in line string mode thoroughly
7. [ ] Test in polygon mode to verify issue exists there too
8. [ ] Add comments explaining precision handling
9. [ ] Consider adding visual debug mode (optional) to show bearing vectors

### Investigation Questions

During implementation, need to answer:
- [ ] What is the exact bearing difference causing the offset? (measure in degrees)
- [ ] Does the issue occur with all segment orientations or only specific angles?
- [ ] Does zoom level affect the magnitude of the offset?
- [ ] Is the drift consistent (always same direction/amount) or variable?
- [ ] Does disabling parallel snap eliminate the issue?
- [ ] Does the orthogonalBearingCache contribute to the problem?
- [ ] What is the bearing stored in `state.snappedLineBearing` vs the actual orthogonal bearing used?

### Backward Compatibility

- Bug fix should not break any existing functionality
- Should maintain same snapping behavior for non-edge-cases
- May improve precision for other orthogonal snap scenarios
- No API changes required

### Testing Checklist

**Geometric Precision Tests:**
- [ ] Draw A→B, trigger bothSnapsActive at P, continue orthogonally - verify lands on A→B line
- [ ] Test with horizontal first segment (bearing 90°)
- [ ] Test with vertical first segment (bearing 0°)
- [ ] Test with diagonal first segment (bearing 45°)
- [ ] Test with diagonal first segment (bearing 135°)
- [ ] Test at zoom level 10 (far out)
- [ ] Test at zoom level 18 (close in)

**Regression Tests:**
- [ ] Regular orthogonal snap still works correctly
- [ ] Parallel snap still works correctly
- [ ] BothSnapsActive detection still works
- [ ] Extended guidelines still work
- [ ] Distance and angle inputs still work
- [ ] Test in line string mode
- [ ] Test in polygon mode
- [ ] Verify no new console errors

**Precision Measurement:**
- [ ] Measure distance from expected position before fix
- [ ] Measure distance from expected position after fix
- [ ] Verify fix reduces offset to < 0.1 meters (or eliminates it)

### Success Criteria

- Chaining orthogonal snaps from a bothSnapsActive point maintains geometric precision
- Following an orthogonal bearing from bothSnapsActive point lands exactly (within <0.1m) on the first segment
- No regression in existing orthogonal, parallel, or other snap behaviors
- Issue is resolved in both line string and polygon modes
- Root cause is identified and documented

### Notes

- This is a geometric precision issue, not a major functional bug
- User experience impact is minor (few meters offset) but affects precision workflows
- Fix may have benefits for overall bearing calculation precision
- Consider if similar precision issues exist in other snap types

---

## TASK-5: Add Configuration for Angle/Distance Input Visibility and Position

**Category**: Enhancement
**Priority**: Medium
**Estimated Effort**: Medium
**Dependencies**: None (can be done independently)

### Current Problem

The angle/distance input UI is always visible and positioned at a fixed location (bottom-center of the map) when using `draw_line_string_distance` and `draw_polygon_distance` modes. Users cannot:
1. Disable the angle/distance input feature entirely
2. Reposition the input container to avoid obscuring important map areas
3. Customize the UI layout to match their application design

### Proposed Solution

Add two new configuration options to MapboxDraw initialization:

```javascript
const draw = new MapboxDraw({
  // ... existing options
  useAngleDistanceInput: true,           // Enable/disable angle and distance input (default: true)
  angleDistanceInputPosition: [0.5, 1.0] // Normalized position [x, y] where 0-1 (default: bottom-center)
});
```

**Coordinate System:**
- `[0, 0]` = top-left corner of map
- `[1, 1]` = bottom-right corner of map
- `[0.5, 0.5]` = center of map
- Position refers to the **center point** of the input container
- Current default position (bottom-center) ≈ `[0.5, 1.0]` or `[0.5, 0.95]`

**Behavior:**
- When `useAngleDistanceInput: false`:
  - Input UI is completely hidden
  - Keyboard shortcuts (D for distance, A for angle) are disabled
  - Mode functions as standard line/polygon drawing mode
- When `useAngleDistanceInput: true`:
  - Input UI is shown at the specified position
  - All angle/distance functionality works normally

### Files to Modify

**Primary Files:**
1. **`src/options.js`**:
   - Add `useAngleDistanceInput: true` (default)
   - Add `angleDistanceInputPosition: [0.5, 1.0]` (default, may need adjustment)

2. **`src/modes/draw_line_string_distance.js`**:
   - Check `ctx.options.useAngleDistanceInput` before creating/showing input UI
   - Check option before enabling keyboard shortcuts
   - Apply `ctx.options.angleDistanceInputPosition` to position the container

3. **`src/modes/draw_polygon_distance.js`**:
   - Same changes as draw_line_string_distance.js

4. **Investigation needed** (current implementation location):
   - Find where the angle/distance input container is created and styled
   - Identify current positioning method (fixed CSS, inline styles, etc.)
   - Determine if container is created per-mode or shared

### Implementation Steps

**Phase 1: Investigation**
1. [ ] Locate where angle/distance input container is created (DOM element creation)
2. [ ] Identify how it's currently positioned (CSS classes, inline styles)
3. [ ] Determine if it's created once or per-mode instance
4. [ ] Find where keyboard event handlers are registered
5. [ ] Document current positioning values/method

**Phase 2: Add Configuration Options**
6. [ ] Add `useAngleDistanceInput: true` to `src/options.js`
7. [ ] Add `angleDistanceInputPosition: [0.5, 1.0]` to `src/options.js` (adjust default after investigation)
8. [ ] Add JSDoc comments explaining the options

**Phase 3: Implement Visibility Toggle**
9. [ ] Modify `draw_line_string_distance.js` to check `useAngleDistanceInput` before showing UI
10. [ ] Disable keyboard handlers (D, A keys) when `useAngleDistanceInput: false`
11. [ ] Modify `draw_polygon_distance.js` with same visibility logic
12. [ ] Test with `useAngleDistanceInput: false` - verify UI is hidden and shortcuts disabled
13. [ ] Test with `useAngleDistanceInput: true` - verify normal behavior

**Phase 4: Implement Position Configuration**
14. [ ] Create helper function to convert normalized position [x, y] to pixel coordinates
15. [ ] Account for map container dimensions (get width/height)
16. [ ] Position container center at calculated pixel coordinates
17. [ ] Add safeguards to prevent container from going off-screen at edges
18. [ ] Apply positioning in `draw_line_string_distance.js`
19. [ ] Apply positioning in `draw_polygon_distance.js`
20. [ ] Test with various positions: `[0, 0]`, `[1, 1]`, `[0.5, 0.5]`, `[0.2, 0.8]`
21. [ ] Test with window resize (verify position updates correctly)

**Phase 5: Optional - Dynamic Updates**
22. [ ] (Optional) Add API method: `draw.setAngleDistanceInputPosition([x, y])`
23. [ ] (Optional) Add API method: `draw.setUseAngleDistanceInput(boolean)`
24. [ ] (Optional) Test dynamic position updates while drawing

**Phase 6: Documentation**
25. [ ] Add comments explaining position calculation
26. [ ] Document the coordinate system (0-1 normalized)
27. [ ] Add usage examples for common positions

### Position Calculation Approach

```javascript
// Helper function to calculate pixel position from normalized coordinates
function calculateInputPosition(map, normalizedPos) {
  const container = map.getContainer();
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  // Normalized position [x, y] where x and y are 0-1
  const [normX, normY] = normalizedPos;

  // Calculate pixel coordinates (center point of container)
  const pixelX = width * normX;
  const pixelY = height * normY;

  // Apply to container (adjust for container's own width/height to center it)
  // Actual implementation depends on how container is positioned
  inputContainer.style.left = `${pixelX}px`;
  inputContainer.style.top = `${pixelY}px`;
  inputContainer.style.transform = 'translate(-50%, -50%)'; // Center on point
}
```

### Backward Compatibility

- Default values maintain current behavior
- Existing users without these options will see no change
- `useAngleDistanceInput: true` by default (enabled)
- `angleDistanceInputPosition: [0.5, 1.0]` by default (bottom-center, matching current position)
- No breaking changes to API

### Testing Checklist

**Visibility Toggle Tests:**
- [ ] Test with `useAngleDistanceInput: false` in line string mode
- [ ] Test with `useAngleDistanceInput: false` in polygon mode
- [ ] Verify UI is completely hidden when disabled
- [ ] Verify D key does nothing when disabled
- [ ] Verify A key does nothing when disabled
- [ ] Verify drawing works normally without input (cursor-based drawing)
- [ ] Test with `useAngleDistanceInput: true` - verify normal behavior

**Position Configuration Tests:**
- [ ] Test default position (should match current behavior)
- [ ] Test `[0, 0]` - top-left corner
- [ ] Test `[1, 1]` - bottom-right corner
- [ ] Test `[0.5, 0.5]` - center
- [ ] Test `[0, 1]` - bottom-left corner
- [ ] Test `[1, 0]` - top-right corner
- [ ] Test `[0.25, 0.75]` - arbitrary position
- [ ] Test `[0.8, 0.2]` - another arbitrary position

**Edge Cases:**
- [ ] Test with values outside 0-1 range (should clamp or handle gracefully)
- [ ] Test with negative values
- [ ] Test with window resize - verify position updates
- [ ] Test with very small map container
- [ ] Test with very large map container
- [ ] Test position doesn't cause container to overflow map edges

**Regression Tests:**
- [ ] All distance/angle snapping features still work
- [ ] Orthogonal snap still works
- [ ] Parallel snap still works
- [ ] Extended guidelines still work
- [ ] Keyboard shortcuts work when enabled
- [ ] Visual feedback renders correctly
- [ ] Test in both line string and polygon modes

**Integration Tests:**
- [ ] Test with other MapboxDraw options (snapDistance, snapLayers, etc.)
- [ ] Test mode switching (simple_select → draw_line_string_distance)
- [ ] Test multiple draw instances with different positions

### Success Criteria

- Users can disable angle/distance input entirely via `useAngleDistanceInput: false`
- When disabled, UI is hidden and keyboard shortcuts are inactive
- Users can position the input container anywhere on the map using normalized coordinates
- Position is specified as center point of container
- Default values maintain backward compatibility (current behavior unchanged)
- Position updates correctly on window resize
- Container doesn't overflow map edges at extreme positions
- Works correctly in both line string and polygon distance modes

### Notes

- This enhancement improves flexibility for different UI layouts
- Particularly useful for applications where bottom-center position conflicts with other UI elements
- Consider adding visual preview in documentation showing the coordinate system
- Future enhancement: could add preset positions like "top-left", "top-right", "bottom-center" as string values

### Optional Enhancements (Future)

If time permits, consider:
- [ ] Add API methods for dynamic updates: `setAngleDistanceInputPosition()`, `setUseAngleDistanceInput()`
- [ ] Add preset position strings: `"top-left"`, `"top-right"`, `"bottom-center"`, `"center"`
- [ ] Add offset option to fine-tune position: `angleDistanceInputOffset: [10, -20]` (pixels from normalized position)
- [ ] Add animation when position changes dynamically
- [ ] Remember last position in localStorage for user convenience

---

## Rollback Strategy

Each task should be implemented in its own git commit(s) with clear commit messages. If any task causes issues:

### TASK-1 Rollback
- Revert commit that added options to `src/options.js`
- Revert commits that consume the new options
- Code falls back to hardcoded values

### TASK-2 Rollback
- Revert commits that use `resolveSnapConflicts()`
- Restore inline conflict resolution logic in all 4 locations
- Remove helper function from `distance_mode_helpers.js`

### TASK-3 Rollback
- Revert commit that adds bounding box to query
- Restore unbounded `queryRenderedFeatures()` call
- Performance is slower but functionality unchanged

### TASK-4 Rollback
- Revert commit(s) that modify bearing calculation precision
- Restore original orthogonal snap logic
- Minor geometric precision issue returns

### TASK-5 Rollback
- Revert commits that add visibility and position options
- Revert commit that adds positioning logic
- UI returns to always-visible, fixed bottom-center position
- No functional impact on drawing features

---

## Overall Testing Checklist

After ALL tasks are completed, perform comprehensive testing:

- [ ] Manual testing in line string distance mode
- [ ] Manual testing in polygon distance mode
- [ ] Test with only orthogonal snap active
- [ ] Test with only parallel snap active
- [ ] Test with both orthogonal and parallel competing
- [ ] Test with bothSnapsActive scenario (double orthogonal)
- [ ] Test with extended guidelines active
- [ ] Test with distance input only
- [ ] Test with angle input only
- [ ] Test with distance + angle input
- [ ] Test at zoom level 10 (far out)
- [ ] Test at zoom level 14 (medium)
- [ ] Test at zoom level 18 (close in)
- [ ] Test with dense snap layer (100+ features)
- [ ] Test with sparse snap layer (5-10 features)
- [ ] Test with no snap layers
- [ ] Test with custom configuration options
- [ ] Verify no console errors or warnings
- [ ] Verify visual feedback renders correctly
- [ ] Verify preview point appears correctly
- [ ] Verify click placement matches preview
- [ ] Verify extended guideline visualization
- [ ] Verify parallel line visualization
- [ ] Run any existing automated tests

---

## Implementation Order

**Recommended order**: TASK-1 → TASK-2 → TASK-3 → TASK-4 → TASK-5

**Rationale**:
1. **TASK-1 first**: Creates the infrastructure (configuration options) needed for other tasks
2. **TASK-2 second**: Refactoring is easier with options in place, can use options in helper function
3. **TASK-3 third**: Performance optimization benefits from clean code and can leverage configuration options
4. **TASK-4 fourth**: Bug fix can be done after refactoring is complete, and diagnostic logging may benefit from cleaner code
5. **TASK-5 last**: UI configuration is independent and can be done anytime; doing it last allows for testing with all other improvements in place

**Alternative orderings**:
- **TASK-4 can be done first** if the geometric precision issue is blocking work - it's independent of other tasks
- **TASK-5 can be done anytime** - it's completely independent and only affects UI positioning
- **TASK-3 can be done earlier** if performance is critical - it's independent
- **Core dependency**: TASK-2 should come after TASK-1 to leverage configuration options in the helper function

---

## Notes

- All tasks are internal optimizations/refactorings
- No user-facing behavior changes when using default options
- Maintains 100% backward compatibility
- Can be implemented and tested incrementally
- Each task is independently valuable
- Git commits should be atomic (one task per commit or logical sub-task per commit)
- Test thoroughly after each task before proceeding to next
