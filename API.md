# API Reference

In order to use GL Draw you must instantiate the draw class like so:

```js
var Draw = mapboxgl.Draw();
map.addControl(Draw);
```

`mapboxgl.Draw()` returns an instance of the `Draw` class which has the following public API methods for getting and setting data:

###`.set(Object) -> String`

This method takes any valid GeoJSON and adds it to Draw. The object will be turned into a GeoJSON feature and will be assigned a unique `drawId` that can be used to identify it. This method return the new feature's `drawId`.

Example:

```js
var feature = { type: 'Point', coordinates: [0, 0] };
var featureId = Draw.set(feature);
console.log(Draw.get(featureId));
//=> { type: 'Point', coordinates: [0, 0] }
```

###`.get(String) -> Object`

This method takes the `drawId` of a feature and returns its GeoJSON object.

Example:

```js
var id = Draw.set({ type: 'Point', coordinates: [0, 0] });
console.log(Draw.get(id));
//=> { type: 'Point', coordinates: [0, 0] }
```

###`.remove(String) -> Draw`

This method takes the `drawId` of feature and removes it from draw. It returns `this` to allow for method chaining.

Example:

```js
Draw
  .remove('123abc')
  .set({ type: 'Point', coordinates: [0, 0] });
```

###`.update(String, Object) -> Draw`

This method takes the `drawId` of an existing feature and a GeoJSON object and replaces that feature in draw with the new feature. It returns `this`.

Example:

```js
var id = Draw.set({ type: 'Point', coordinates: [0, 0] });
var newFeature = Draw
  .update(id, { type: 'Point', coordinates: [1, 1] })
  .get(id);
console.log(newFeature);
//=> { type: 'Point', coordinates: [0, 0] }
```

###`.get(String) -> Object`

This method takes the `drawId` of a feature and returns its GeoJSON object.

Example:

```js
var id = Draw.set({ type: 'Point', coordinates: [0, 0] });
console.log(Draw.get(id));
//=> { type: 'Point', coordinates: [0, 0] }
```

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

###`.clear() -> Draw`

This method removes all geometries in Draw.

###`.clearAll() -> Draw`

This method removes all geometries in Draw and deletes the history.

## Events

Draw fires off a number of events on draw and edit actions.

###`draw.start`

Fired when a drawing is started. Passes an object with the the feature type to the callback (`{ featureType: <String> }`). Note that these are gl-draw feature type, one of `point`, `line`, `polygon`, `square`.

Example:

```
map.on('draw.start', function(e) {
  alert('Started drawing a ', e.featureType);
});
```

###`draw.end`

Fired when a drawing is finished. Passes an object with the feature type and the geojson geometry to the callback.

Example:

```
map.on('draw.end', function(e) {
  alert('Finished drawing a ', e.featureType, 'with the coordintes', JSON.stringify(e.geometry.coordinates));
});
```

###`draw.feature.update`

Fired while drawing when a new vertex is added. Passes the geometry being drawn to the callback.

Example:

```
map.on('draw.feature.update', function(e) {
  alert('new draw edit!', JSON.stringify(e.geojson));
});
```

###`draw.feature.edit`

Fired while editting when a new edit is made. Passes the new geometry to the callback.

Example:

```
map.on('edit.feature.update', function(e) {
  alert('new edit!', JSON.stringify(e.geojson));
});
```