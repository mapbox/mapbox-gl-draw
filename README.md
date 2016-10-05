# mapbox-gl-draw.js

Adds support for drawing and editing features on [mapbox-gl.js](https://www.mapbox.com/mapbox-gl-js/) maps.

[![Circle CI](https://circleci.com/gh/mapbox/mapbox-gl-draw/tree/master.svg?style=svg)](https://circleci.com/gh/mapbox/gl-draw/tree/master)

**All versions below 0.6.0 are no longer supported**

### Installing

```
npm install mapbox-gl-draw
```

Require or include `mapbox-gl-draw` after `mapbox-gl`.

Also include [mapbox-gl-draw.css](https://github.com/mapbox/mapbox-gl-draw/blob/dev-pages/dist/mapbox-gl-draw.css)

```html
<link href="mapbox-gl-draw.css" rel="stylesheet" />
```

### Usage in your application

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

### Naming things

We're trying to follow standards when naming things. Here is a collection of links where we look for inspriation.

- http://turfjs.org/docs/
- http://toblerity.org/shapely/manual.html
