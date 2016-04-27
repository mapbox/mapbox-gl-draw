# API Reference

To use Draw

```js
var Draw = mapboxgl.Draw({ options });
map.addControl(Draw);
```

Draw only works after the map has loaded so it is wise to perform any interactions in the `load` event callback of mapbox-gl:

```js
map.on('load', function() {
    Draw.add({ ... });
    console.log(Draw.getAll());
    ...
});
```

## Options

option | values | function
--- | --- | ---
drawing | boolean | The ability to draw and delete features - default: `true`
keybindings | boolean | Keyboard shortcuts for drawing - default: `true`
displayControlsDefault | boolean | Sets default value for the control keys in the control option - default `true`
controls | Object | Lets you hide or show individual controls. See `displayControlsDefault` for default. Available options are: point, line, polygon and trash.
styles | Array | An array of style objects. By default draw provides a style for you. To override this see [Styling Draw](#styling-draw) further down.

## API Methods

`mapboxgl.Draw()` returns an instance of `Draw` which has the following API for working with your data:

###`.add(Object: GeoJSON) -> String || [String]`

This method takes either a Feature or a FeatureCollection and adds it to Draw. It returns an id for interacting with the added feature. When a FeatureCollection is provided an array of ids is returned. If there is no ID on the feature, a random ID will be genearted.

Currently the only supoorted GeoJSON feature types are `Point`, `LineString` and `Polygon`.

Adding a feature with the same id as another feature in Draw forces an update.

Example:

```js
var feature = { type: 'Point', coordinates: [0, 0] };
var featureId = Draw.add(feature);
console.log(featureId);
//=> 'random-string'
```

Example with ID:

```js
var feature = { type: 'Point', coordinates: [0, 0], id: 'unique-id' };
var featureId = Draw.add(feature);
console.log(featureId)
//=> unique-id
```

---
###`.get(String: feature.id) -> Object`

This method takes an ID returns a GeoJSON feature.

Example:

```js
var id = Draw.add({ type: 'Point', coordinates: [0, 0] });
console.log(Draw.get(id));
//=> { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }
```

---
###`.getAll() -> Object`

This method returns all features added to Draw in a single GeoJSON FeatureCollection.

Example:

```js
Draw.add({ type: 'Point', coordinates: [0, 0] });
Draw.add({ type: 'Point', coordinates: [1, 1] });
Draw.add({ type: 'Point', coordinates: [2, 2] });
console.log(Draw.getAll());
// => {
//  type: 'FeatureCollection',
//  features: [
//    {
//      id: 'random-0'
//      type: 'Feature',
//      geometry: {
//        type: 'Point',
//        coordinates: [0, 0]
//      }
//    },
//    {
//      id: 'random-1'
//      type: 'Feature',
//      geometry: {
//        type: 'Point',
//        coordinates: [1, 1]
//      }
//    },
//    {
//      id: 'random-2'
//      type: 'Feature',
//      geometry: {
//        type: 'Point',
//        coordinates: [2, 2]
//      }
//    }
//  ]
//}
```
---

###`.delete(String: id) -> Draw`

This method takes an id removes the coorisponding feature from Draw.

In `direct_select` mode, deleting the active feature will stop the mode and revert to the `simple_select` mode.

Example:

```js
var feature = { type: 'Point', coordinates: [0, 0] };
var id = draw.add(feature)
Draw
  .delete(id)
  .getAll();
// => { type: 'FeatureCollection', features: [] }
```

---

###`.deleteAll() -> Draw`

This method removes all geometries in Draw.

Example:

```js
Draw.add({ type: 'Point', coordinates: [0, 0] });
Draw
  .deleteAll()
  .getAll();
// => { type: 'FeatureCollection', features: [] }
```

---

### `.trash() -> Draw`

This envokes the current modes trash event. For the `simple_select` mode this deletes all active features. For the `direct_select` mode this deletes the active vertices. For the drawing modes, these cancel the current process.

This is different from `delete` or `deleteAlll` in that it follows rules described by the current mode.

---

### `.changeMode(String: mode, ?Any: options) -> Draw`

`changeMode` triggers the mode switching process inside Draw. `mode` must be one of the below strings. Each mode takes its own arguments. They are descibed in detail below.

#### Mode: `simple_select`

Lets you select, delete and drag features.

For `simple_select` options is an array of ids. It is optional. If provided, these features will be active at the start of the mode. In this mode, features can have their active state changed by the user. To control what is active, react to changes as described in the events section below.

#### Mode: `direct_select`

Lets you select, delete and drag vertices.

For `direct_select`options is a single featureId. It is required. This feature will be active for the duration of the mode.

#### Drawing modes:

The three drawing modes work identically. They do not take an options argument.

- `draw_line_string`: Draws a LineString feature.
- `draw_polygon`: Draws a Polygon feature.
- `draw_point`: Draws a Point feature.

## Events

Draw fires off a number of events. All of these events are name spaced `draw.` and are emitted via map object.

### draw.modechange

This event is fired just after the current mode is stopped and just before the next mode is started. A render will not happen until after all event handlers have been triggered. This means you can force a mode redirect by calling `changeMode` inside of a `draw.modechange` handler.

This is not fired when the first mode is started.

Here is an example payload.

```js
{
  mode: `direct_select`
  opts: '123123123'
}
```

### draw.deleted

This is fired every time a feature is deleted. The payload is a list GeoJSON features just before they were deleted.

### draw.changed

This is fired when feature coordinates are changed. It is fired just after the changes have been sent to be rendered. The payload is the GeoJSON of all changed features. Deleted features will not show up here.

```js
{
  "features": [{ ... }]
}
```

### draw.mode.default.selected.start

This is fired every time a feature is selected in the default mode. The payload is an array of feature ids being selected. This is **NOT** fired when the mode starts as this information is in the `draw.modechange` event.

### draw.mode.default.selected.end

This is fired every time a feature is unselected in the default mode. The payload is an array of feature ids being unselected. This is **NOT** fired when the mode stops, as this can be assumed via the `draw.modechange` event.

## Styling Draw

Draw is styled by the [Mapbox GL Style Spec](https://www.mapbox.com/mapbox-gl-style-spec/) with a preset list of properties.

The `GL Style Spec` requires each layer to have a source. **DO NOT PROVIDE THIS** for styling draw.

The `GL Style Spec` also requires an id. Draw will provide this for you. If you wish to set this id to interact with draw layers, know that Draw will add `hot` and `cold` if no source is provided.

Draw moves features between sources for performance gains, because of this it is recommeneded that you **DO NOT** provide a source for a style despite the fact the `GL Style Spec` requires a source. **Draw will provide the source for you automatically**.

If you need to style gl-draw for debugging sources the source names are `mapbox-gl-draw-hot` and `mapbox-gl-draw-cold`.

property | values | function
--- | --- | ---
meta | feature, midpoint, vertex, too-small | `midpoint` and `vertex` are used on points added to the map to communicate polygon and line handles. `feature` is used for all features added by the user. `too-small` is used to indicate a point that represents the center of a collection of features that are too small at the current zoom level to be seen.
active | true, false | A feature is active when it is 'selected' in the current mode. `true` and `false` are strings.
mode |  simple_select, direct_select, draw_point, draw_line_string, draw_polygon | Indicates which mode Draw is currently in.
hover | true, false | `true` and `false` are strings. `hover` is true when the mouse is over the feature.

Draw also provides a few more properties, but they should not be used for styling. For details on them, see `Using Draw with map.queryRenderFeatures`.

### Example Custom Style

With this style all Point features are blue and have a black halo when active. No other features are rendered, even if they are present.

```js
mapbox.Draw({
  style: [
    {
      'id': 'highlight-active-points',
      'type': 'circle',
      'filter': ['all',
        ['==', '$type', 'Point'],
        ['==', 'meta', 'feature'],
        ['==', 'active', 'true']],
      'paint': {
        'circle-radius': 7,
        'circle-color': '#000000'
      },
      'interactive': true
    },
    {
      'id': 'points-are-blue',
      'type': 'circle',
      'filter': ['all',
        ['==', '$type', 'Point'],
        ['==', 'meta', 'feature'],
        ['==', 'active', 'true']],
      'paint': {
        'circle-radius': 5,
        'circle-color': '#000088'
      },
      'interactive': true
    }
  ]
});
```

## Using Draw with `map.queryRenderFeatures`

property | values | function
--- | --- | ---
id | string | only available when `meta` is `feature`
parent | string | only avaible when `meta` is not `feature`
coord_path | string | a `.` seporated path to one [lon, lat] entity in the parents coordinates
lon | number | the longitude value of a handle. Only available when `meta` is `midpoint`.
lat | number | the latitude value of a handle. Only available when `meta` is `midpoint`.
