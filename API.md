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


`mapboxgl.Draw()` returns an instance of the `Draw` class which has the following public API methods for getting and setting data:

## API Methods

####`.set(Object: geojsonFeature) -> String`

This method takes any valid GeoJSON and adds it to Draw. The object will be turned into a GeoJSON feature and will be assigned a unique `drawId` that can be used to identify it. This method return the new feature's `drawId`.

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

Draw fires off a number of events on draw and edit actions.


####`drawing.start`

Fired when a drawing is started. Passes an object with the the feature type to the callback (`{ featureType: <String> }`). Note that these are gl-draw feature type, one of `point`, `line`, `polygon`, `square`.

Example:

```
map.on('drawing.start', function(e) {
  alert('Started drawing a ', e.featureType);
});
```

---
####`drawing.end`

Fired when a drawing is finished. Passes an object with the feature type and the geojson geometry to the callback.

Example:

```
map.on('drawing.end', function(e) {
  alert('Finished drawing a ', e.featureType, 'with the coordintes', JSON.stringify(e.geometry.coordinates));
});
```

---

####`edit.new`

Fired while editting when a new edit is made. Passes an object with the new geometry and its drawId to the callback.

Example:

```
map.on('edit.new', function(e) {
  alert('new edit on', e.id, '->', JSON.stringify(e.geojson));
});
```
