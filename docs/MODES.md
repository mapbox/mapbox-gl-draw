# Creating modes for Mapbox Draw

In Mapbox Draw, modes are used to group sets of user interactions into one behavior. Internally Draw has the `draw_polygon` mode, which controls a bunch of interactions for drawing a polygon. Draw also has the `simple_select` mode which controls interactions when zero, one or many features are selected including transitioning to `direct_select` mode when a user's interactions imply that they want to do detailed edits of a single feature.

To help developers have more control of their Mapbox Draw powered application, Draw provides an interface for writing and hooking in custom modes. Below we will see how to write these modes by working through a small example.

## Writing Custom Modes

We're going to create a custom mode called `LotsOfPointsMode`. When active, this mode will create a new point each time a user clicks on the map and will transition to the default mode when the user hits the esc key.

```js
var LotsOfPointsMode = {};

// When the mode starts this function will be called.
// The `opts` argument comes from `draw.changeMode('lotsofpoints', {count:7})`.
// The value returned should be an object and will be passed to all other lifecycle functions
LotsOfPointsMode.onSetup = function(opts) {
  var state = {};
  state.count = opts.count || 0;
  return state;
};

// Whenever a user clicks on the map, Draw will call `onClick`
LotsOfPointsMode.onClick = function(state, e) {
  // `this.newFeature` takes geojson and makes a DrawFeature
  var point = this.newFeature({
    type: 'Feature',
    properties: {
      count: state.count
    },
    geometry: {
      type: 'Point',
      coordinates: [e.lngLat.lng, e.lngLat.lat]
    }
  });
  this.addFeature(point); // puts the point on the map
};

// Whenever a user clicks on a key while focused on the map, it will be sent here
LotsOfPointsMode.onKeyUp = function(state, e) {
  if (e.keyCode === 27) return this.changeMode('simple_select');
};

// This is the only required function for a mode.
// It decides which features currently in Draw's data store will be rendered on the map.
// All features passed to `display` will be rendered, so you can pass multiple display features per internal feature.
// See `styling-draw` in `API.md` for advice on making display features
LotsOfPointsMode.toDisplayFeatures = function(state, geojson, display) {
  display(geojson);
};

// Add the new draw mode to the MapboxDraw object
var draw = new MapboxDraw({
  defaultMode: 'lots_of_points',
  // Adds the LotsOfPointsMode to the built-in set of modes
  modes: Object.assign({
    lots_of_points: LotsOfPointsMode,
  }, MapboxDraw.modes),
});
```

For more info on how to handle map interactions see [Life Cycle Functions](#life-cycle-functions). For more info on how to interact with Draw's internal state see [Setters & Getters](#setters-and-getters).

## Available Custom Modes

_please feel free to add your own modes to this list via a PR_

-   [Static Mode](https://github.com/mapbox/mapbox-gl-draw-static-mode): Turn off interactions
-   [Cut/Split Line Mode](https://github.com/BrunoSalerno/mapbox-gl-draw-cut-line-mode): Cut/split lineStrings functionality
-   [Freehand Mode](https://github.com/bemky/mapbox-gl-draw-freehand-mode): Add Freehand functionality to draw polygon mode
-   [Rotate Mode](https://github.com/mapstertech/mapbox-gl-draw-rotate-mode): Add ability to Rotate GL Draw features
-   [Radius Mode](https://gist.github.com/chriswhong/694779bc1f1e5d926e47bab7205fa559): Draws a polygon circle based on a center vertex and radius line
-   [Rectangle Mode](https://github.com/edgespatial/mapbox-gl-draw-rectangle-mode)
-   [Circle Mode](https://github.com/iamanvesh/mapbox-gl-draw-circle)
-   [Assisted Rectangle Mode](https://github.com/geostarters/mapbox-gl-draw-assisted-rectangle-mode)
-   [Rotate/Scale Rectangle Mode](https://github.com/drykovanov/mapbox-gl-draw-rotate-scale-rect-mode)
-   [Rectangle Restrict Area Mode](https://github.com/dqunbp/mapbox-gl-draw-rectangle-restrict-area): Drawing a rectangle with a limited area
-   [Geodesic Modes](https://github.com/zakjan/mapbox-gl-draw-geodesic): Draw geodesic lines, polygons and circles
-   [Cut/Split Line Mode](https://github.com/ReyhaneMasumi/mapbox-gl-draw-split-line-mode): Cut/Split linestrings/Multilinestrings with linestring, point or polygon
-   [Cut Polygon Mode](https://github.com/ReyhaneMasumi/mapbox-gl-draw-cut-polygon-mode): Cut polygons/Multipolygons with a polygon
-   [Split Polygon Mode](https://github.com/ReyhaneMasumi/mapbox-gl-draw-split-polygon-mode): Split polygons/Multipolygons with a linestring
-   [Scale/Rotate Mode](https://github.com/ReyhaneMasumi/mapbox-gl-draw-scale-rotate-mode): Scale and Rotate polygons and lines
-   [Waypoint Mode](https://github.com/zakjan/mapbox-gl-draw-waypoint): Allow user to drag vertices only, prevent dragging features
-   [Bezier Curve Mode](https://github.com/Jeff-Numix/mapbox-gl-draw-bezier-curve-mode): Draw and edit bezier curves
-   [Snapping Mode](https://github.com/mhsattarian/mapbox-gl-draw-snap-mode): Add snapping ability while drawing features
-   [Pinning Mode](https://github.com/mhsattarian/mapbox-gl-draw-pinning-mode): Pin shared coordinates together during edit
-   [Passing Mode](https://github.com/mhsattarian/mapbox-gl-draw-passing-mode): Add ability to draw features but don't add them
-   [Select Feature Mode](https://github.com/mhsattarian/mapbox-gl-draw-select-mode): Select features by click and highlight on hover
-   [Paint Mode](https://github.com/piraveenankirupakaran/mapbox-gl-draw-paint-mode): Allows users to paint freestyle on the map


## Life Cycle Functions

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### MODE.onSetup

Triggered while a mode is being transitioned into.

**Parameters**

-   `opts`  {Object} - this is the object passed via `draw.changeMode('mode', opts)`;

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** this object will be passed to all other life cycle functions

### MODE.onDrag

Triggered when a drag event is detected on the map

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onClick

Triggered when the mouse is clicked

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onMouseMove

Triggered with the mouse is moved

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onMouseDown

Triggered when the mouse button is pressed down

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onMouseUp

Triggered when the mouse button is released

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onMouseOut

Triggered when the mouse leaves the map's container

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onKeyUp

Triggered when a key up event is detected

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onKeyDown

Triggered when a key down event is detected

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onTouchStart

Triggered when a touch event is started

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onTouchMove

Triggered when one drags their finger on a mobile device

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onTouchEnd

Triggered when one removes their finger from the map

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onTap

Triggered when one quickly taps the map

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `e`  {Object} - the captured event that is triggering this life cycle event

### MODE.onStop

Triggered when the mode is being exited, to be used for cleaning up artifacts such as invalid features

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup

### MODE.onTrash

Triggered when [draw.trash()](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#trash-draw) is called.

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup

### MODE.onCombineFeature

Triggered when [draw.combineFeatures()](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#combinefeatures-draw) is called.

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup

### MODE.onUncombineFeature

Triggered when [draw.uncombineFeatures()](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#uncombinefeatures-draw) is called.

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup

### MODE.toDisplayFeatures

Triggered per feature on render to convert raw features into set of features for display on the map
See [styling draw](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#styling-draw) for information about what geojson properties Draw uses as part of rendering.

**Parameters**

-   `state`  {Object} - a mutible state object created by onSetup
-   `geojson`  {Object} - a geojson being evaulated. To render, pass to `display`.
-   `display`  {Function} - all geojson objects passed to this be rendered onto the map

## Setters and Getters

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### this.setSelected

Sets Draw's internal selected state

**Parameters**

-   `features`  
-   `null-null` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;DrawFeature>** whats selected as a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js)

### this.setSelectedCoordinates

Sets Draw's internal selected coordinate state

**Parameters**

-   `coords` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** a array of {coord_path: 'string', feature_id: 'string'}

### this.getSelected

Get all selected features as a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js)

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;DrawFeature>** 

### this.getSelectedIds

Get the ids of all currently selected features

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>** 

### this.isSelected

Check if a feature is selected

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** a feature id

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

### this.getFeature

Get a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js) by its id

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** a feature id

Returns **DrawFeature** 

### this.select

Add a feature to draw's internal selected state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### this.delete

Remove a feature from draw's internal selected state

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### this.deleteFeature

Delete a feature from draw

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** a feature id
-   `opts`   (optional, default `{}`)

### this.addFeature

Add a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js) to draw.
See `this.newFeature` for converting geojson into a DrawFeature

**Parameters**

-   `feature` **DrawFeature** the feature to add

### clearSelectedFeatures

Clear all selected features

### clearSelectedCoordinates

Clear all selected coordinates

### this.setActionableState

Indicate if the different actions are currently possible with your mode
See [draw.actionalbe](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#drawactionable) for a list of possible actions. All undefined actions are set to **false** by default

**Parameters**

-   `actions` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

### this.changeMode

Trigger a mode change

**Parameters**

-   `mode` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the mode to transition into
-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the options object to pass to the new mode (optional, default `{}`)
-   `eventOpts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** used to control what kind of events are emitted. (optional, default `{}`)

### this.updateUIClasses

Update the state of draw map classes

**Parameters**

-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### this.activateUIButton

If a name is provided it makes that button active, else if makes all buttons inactive

**Parameters**

-   `name` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** name of the button to make active, leave as undefined to set buttons to be inactive

### this.featuresAt

Get the features at the location of an event object or in a bbox

**Parameters**

-   `event`  
-   `bbox`  
-   `bufferType` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** is this `click` or `tap` event, defaults to click (optional, default `'click'`)

### this.newFeature

Create a new [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js) from geojson

**Parameters**

-   `geojson` **GeoJSONFeature** 

Returns **DrawFeature** 

### this.isInstanceOf

Check is an object is an instance of a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js)

**Parameters**

-   `type` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** `Point`, `LineString`, `Polygon`, `MultiFeature`
-   `feature` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the object that needs to be checked

Returns **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

### this.doRender

Force draw to rerender the feature of the provided id

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** a feature id
