GL Draw
---

Adds support for drawing and editing features on [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/) maps.

[![Circle CI](https://circleci.com/gh/mapbox/mapbox-gl-draw/tree/master.svg?style=svg)](https://circleci.com/gh/mapbox/gl-draw/tree/master)

### Installing

```
git clone https://github.com/mapbox/mapbox-gl-draw.git
cd mapbox-gl-draw
npm install
```

Include [mapbox-gl-draw.js](https://github.com/mapbox/mapbox-gl-draw/blob/master/dist/mapbox-gl-draw.js) after `mapbox-gl.js`

```html
<script src="mapbox-gl.js"></script>
<script src="mapbox-gl-draw.js"></script>
```

Also include [mapbox-gl-draw.css](https://github.com/mapbox/mapbox-gl-draw/blob/dev-pages/dist/mapbox-gl-draw.css)

```html
<link href="mapbox-gl-draw.css" rel="stylesheet" />
```

### Usage

```js
mapboxgl.accessToken = 'YOUR_ACCESS_TOKEN';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v8',
  center: [40, -74.50],
  zoom: 9
});

var Draw = mapboxgl.Draw();

map.addControl(Draw)
```

### See [API.md](https://github.com/mapbox/mapbox-gl-draw/blob/master/API.md) for complete reference.

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
