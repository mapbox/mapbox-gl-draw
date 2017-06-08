# @mapbox/mapbox-gl-draw

[![Greenkeeper badge](https://badges.greenkeeper.io/mapbox/mapbox-gl-draw.svg)](https://greenkeeper.io/) [![Build Status](https://travis-ci.org/mapbox/mapbox-gl-draw.svg?branch=master)](https://travis-ci.org/mapbox/mapbox-gl-draw)

Adds support for drawing and editing features on [mapbox-gl.js](https://www.mapbox.com/mapbox-gl-js/) maps. [See a live example here](https://www.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/)

**Requires [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js). Compatible versions are documented in the package.json**

**On NPM this package has recently moved from `mapbox-gl-draw` to `@mapbox/mapbox-gl-draw`**

### Installing

```
npm install @mapbox/mapbox-gl-draw
```

Draw ships with CSS, make sure you include it in your build. It can be found on our CDN or at `require('mapbox-gl-draw/dist/mapbox-gl-draw.css')`.

```html
<link rel='stylesheet' href='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v0.17.4/mapbox-gl-draw.css' type='text/css' />
```

### Usage in your application

**When using modules**

```js
var mapboxgl = require('mapbox-gl');
var MapboxDraw = require('@mapbox/mapbox-gl-draw');
```

**When using a CDN**

```html
<script src='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v0.17.4/mapbox-gl-draw.js'></script>
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

https://www.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/

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
npm run prepublish
npm version (major|minor|patch)
git push --tags
git push
npm publish
```

Update the version number in [the GL JS example](https://github.com/mapbox/mapbox-gl-js/blob/mb-pages/docs/_posts/examples/3400-01-25-mapbox-gl-draw.html).

### Naming actions

We're trying to follow standards when naming things. Here is a collection of links where we look for inspriation.

- http://turfjs.org/docs.html
- http://toblerity.org/shapely/manual.html
