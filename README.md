gl-draw
---

Adds support for drawing and editing features on [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/) maps.

[![Circle CI](https://circleci.com/gh/mapbox/gl-draw/tree/dev-pages.svg?style=svg&circle-token=9a1c59bacd6403294df7c5191a33adc7615ce1e7)](https://circleci.com/gh/mapbox/gl-draw/tree/dev-pages)

### Installing

```
npm install
```

Include [mapboxgl.draw.js]() after `mapbox-gl.js`

```html
<script src="mapbox-gl.js"></script>
<script src="mapboxgl.draw.js"></script>
```

You'll also want to include [mapboxgl.draw.css](https://github.com/mapbox/gl-draw/blob/dev-pages/dist/mapboxgl.draw.css)

```html
<link href="mapboxgl.draw.css" rel="stylesheet" />
```

### Usage

```js
mapboxgl.accessToken = localStorage.accessToken;

var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json', //stylesheet location
  center: [40, -74.50], // starting position
  zoom: 9 // starting zoom
});

var Draw = mapboxgl.Draw({
  position: 'top-left',
  keybindings: true,
  geoJSON: [],
  controls: {
    marker: true,
    line: true,
    shape, true,
    square: true
  }
});

map.addControl(Draw)

map.on('draw.start', function(e) {
  console.log(e.featureType);
  // => 'Polygon'|'Square'|'LineString'|'Marker'
});

map.on('draw.end', function(e) {
  console.log(e.featureType);
  // => 'Polygon'|'Square'|'LineString'|'Marker'
});

map.on('draw.created', function(e) {
  console.log(e.featureType);
  // => 'Polygon'|'Square'|'LineString'|'Marker'
  console.log(e.feature);
  // => feature
});

var input = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Point',
    coordinates: [0, 0]
  }
};

Draw.addGeometry(input);

var geoms = Draw.getAll();

var id = geoms.features[0].properties.drawId;

var g = Draw.get(id);

console.log(g);
// => input

Draw.clear();
```

### Developing

Install dependencies, build the source files and crank up a server via:

```
npm start & open http://localhost:9966/debug
```

To run the example apps

```
npm run-script build-examples
npm start
open http://localhost:9966/examples/geojson-editor-example/ && open http://localhost:9966/examples/node-example/
```

### Testing


```
npm run test
```
