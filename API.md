# API Reference

In order to use GL Draw you must instantiate the draw class like so:

```js
var Draw = mapboxgl.Draw({ options });
map.addControl(Draw);
```

**Note: make sure to instantiate `Draw` before any calls to `map.on('load')`**

Draw only works after the map has loaded so it is wise to perform any interactions in the `load` event callback of mapbox-gl:

```js
map.on('load', function() {
    Draw.set({ ... });
    console.log(Draw.getAll());
    ...
});
```

### Options

option | values | function
--- | --- | ---
drawing | boolean | The ability to draw and delete features - default: `true`
interactive | boolean | Keep all features permanently in edit mode - default: `false`
keybindings | boolean | Keyboard shortcuts for drawing - default: `true`
controls | Object | drawable shapes - default `{ marker: true, line: true, shape: true, square: true }`
styles | Object | Add a style with any of the following properties: <li>`gl-draw-polygon`</li><li>`gl-draw-polygon-stroke`</li><li> `gl-draw-line`</li><li> `gl-draw-point`</li><li> `gl-drawing-line`</li><li> `gl-drawing-polygon`</li><li> `gl-drawing-polygon-stroke`</li><li> `gl-drawing-points`</li><li> `gl-edit-line`</li><li> `gl-edit-polygon`</li><li> `gl-edit-polygon-stroke`</li><li> `gl-edit-point`</li><li> `gl-edit-point-mid`</li>The property should be an object with either the `layout` and/or `paint` properties as specified in the [Mapbox GL Style Reference](https://www.mapbox.com/mapbox-gl-style-spec/). It will overwrite the corresponding default  styles found in [`src/theme/`](https://github.com/mapbox/mapbox-gl-draw/tree/master/src/theme).

Custom Style Example:

```js
var Draw = mapboxgl.Draw({
  styles: {
    'gl-draw-polygon': {
      'paint': {
        'fill-color': '#00ffff',
        'fill-outline-color': '#00ffff',
        'fill-opacity': 0.25
      }
    },
    'gl-draw-polygon-stroke': {
      'paint': {
        'line-color': '#0000ff',
        'line-width': 4
      }
    }
  }
});
```


`mapboxgl.Draw()` returns an instance of the `Draw` class which has the following public API methods for getting and setting data:

## API Methods

####`.set(Object: geojsonFeature, [Object]: options) -> String`

This method takes any valid GeoJSON and adds it to Draw. The object will be turned into a GeoJSON feature and will be assigned a unique `drawId` that can be used to identify it. This method return the new feature's `drawId`. The second argument is an optional options object to add information to the geometry when creating the new element. Currently the only used option is `permanent`, which, if set to true, will cause the element to ignore click events which would normally trigger editing.

Example:

```js
var feature = { type: 'Point', coordinates: [0, 0] };
var featureId = Draw.set(feature);
console.log(Draw.get(featureId));
//=> { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }
```

---
####`.get(String: drawId, [Boolean]: includeDrawIdInProps) -> Object`

This method takes the `drawId` of a feature and returns its GeoJSON object. If the optional second argument is set to `true`, the feature returned will include its `drawId` in its properties.

Example:

```js
var id = Draw.set({ type: 'Point', coordinates: [0, 0] });
console.log(Draw.get(id));
//=> { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }
```

---
####`.getAll([Boolean]: includeDrawIdInProps) -> Object`

This method returns all features added to Draw in a single GeoJSON FeatureCollection. If the optional argument is set to `true`, the feature returned will include its `drawId` in its properties.


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
//      type: 'Feature',
//      geometry: {
//        type: 'Point',
//        coordintates: [0, 0]
//      }
//    },
//    {
//      type: 'Feature',
//      geometry: {
//        type: 'Point',
//        coordintates: [1, 1]
//      }
//    },
//        {
//      type: 'Feature',
//      geometry: {
//        type: 'Point',
//        coordintates: [2, 2]
//      }
//    }
//  ]
//}
```
---

####`.remove(String: drawId) -> Draw`

This method takes the `drawId` of feature and removes it from draw. It returns `this` to allow for method chaining.

Example:

```js
var feature = { type: 'Point', coordinates: [0, 0] };
var id = draw.set(feature)
Draw
  .remove(id)
  .getAll();
// => { type: 'FeatureCollection', features: [] }
```

---

####`.update(String: drawId, Object: geojsonFeature) -> Draw`

This method takes the `drawId` of an existing feature and a GeoJSON object and replaces that feature in draw with the new feature. It returns `this`.

Example:

```js
var id = Draw.set({ type: 'Point', coordinates: [0, 0] });
var newFeature = Draw
  .update(id, { type: 'Point', coordinates: [1, 1] })
  .get(id);
console.log(newFeature);
//=> { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] } }
```


####`.clear() -> Draw`

This method removes all geometries in Draw.

Example:

```js
Draw.set({ type: 'Point', coordinates: [0, 0] });
Draw
  .clear()
  .getAll();
// => { type: 'FeatureCollection', features: [] }
```

## Events

Draw fires off a number of events on draw and edit actions. All of these events are name spaced `draw` inside of the mapboxgl event emitter.

#### draw.set

This is fired every time a feature is commited via escape or the double click. The payload is an object with the `mapbox-gl-draw` feature id and the geojson representation of the feature.

#### draw.delete

This is fired every time a feature is deleted inside of `mapbox-gl-draw`. The payload is an object with the `mapbox-gl-draw` feature id of the feature that was deleted and the geojson representation of the feature just before it was deleted.

#### draw.edit.start

Fired every time a feature is selected for edit. The payload is an object with the `mapbox-gl-draw` feature id and the geojson representation of the feature.

#### draw.edit.end

Fired every time a feature is unselected for edit. The payload is an object with the `mapbox-gl-draw` feature id.
