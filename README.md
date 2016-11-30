# mapbox-gl-draw.js

Adds support for drawing and editing features on [mapbox-gl.js](https://www.mapbox.com/mapbox-gl-js/) maps.

[![Circle CI](https://circleci.com/gh/mapbox/mapbox-gl-draw/tree/master.svg?style=svg)](https://circleci.com/gh/mapbox/gl-draw/tree/master)

**Requires [mapbox-gl-js@0.27.0](https://github.com/mapbox/mapbox-gl-js/blob/master/CHANGELOG.md#0270-november-11-2016) or higher.**

### Installing

```
npm install mapbox-gl-draw
```

Draw ships with CSS, make sure you include it in your build. It can be found on our CDN or at `require('mapbox-gl-draw/dist/mapbox-gl-draw.css')`.

```html
<link rel='stylesheet' href='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v0.14.0/mapbox-gl-draw.css' type='text/css' />
```

### Usage in your application

**When using modules**

```js
var mapboxgl = require('mapbox-gl');
var MapboxDraw = require('mapbox-gl-draw');
```

**When using a CDN**

```html
<script src='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v0.14.0/mapbox-gl-draw.js'></script>
```

**Example setup**

```js
mapboxgl.accessToken = 'YOUR_ACCESS_TOKEN';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v8',
  center: [40, -74.50],
  zoom: 9
});

var Draw = new MapboxDraw();

map.addControl(Draw)
```

### See [API.md](https://github.com/mapbox/mapbox-gl-draw/blob/master/API.md) for complete reference.

### Developing and testing

Install dependencies, build the source files and crank up a server via:

```
git clone git@github.com:mapbox/mapbox-gl-draw.git
npm install
npm start & open http://localhost:9966/debug/?access_token=<token>
```

### Testing

```
npm run test
```

### Publishing

To github and npm

```
npm version (major|minor|patch)
git push --tags
git push
npm publish
```

To add to CDN add the js and css files from the `dist` folder to [mapbox-gl-plugins](https://github.com/mapbox/mapbox-gl-plugins/tree/master/plugins/mapbox-gl-draw).

### Naming actions

We're trying to follow standards when naming things. Here is a collection of links where we look for inspriation.

- http://turfjs.org/docs/
- http://toblerity.org/shapely/manual.html
