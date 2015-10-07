GL Draw
---

Adds support for drawing and editing features on [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/) maps.

[![Circle CI](https://circleci.com/gh/mapbox/gl-draw/tree/dev-pages.svg?style=svg&circle-token=9a1c59bacd6403294df7c5191a33adc7615ce1e7)](https://circleci.com/gh/mapbox/gl-draw/tree/dev-pages)

### Installing

```
git clone https://github.com/mapbox/gl-draw.git
cd gl-draw
npm install
```

Include [mapboxgl.draw.js](https://github.com/mapbox/gl-draw/blob/master/dist/mapboxgl.draw.js) after `mapbox-gl.js`

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
See [API.md](https://github.com/mapbox/gl-draw/blob/master/API.md) for advanced usage.

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
