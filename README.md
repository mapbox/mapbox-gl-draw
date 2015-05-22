mapboxgl.draw
---

[![Build Status](https://circleci.com/gh/mapbox/gl-draw/tree/dev-pages.svg?style=shield)](https://circleci.com/gh/mapbox/gl-draw/)

Adds support for drawing and editing features on [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/) 
maps.

### Installing 

    npm install

### Developing 

Install dependencies, build the source files and crank up a server via:

    npm start & open http://localhost:9966/debug/

You'll need to set a [Mapbox API token](https://www.mapbox.com/help/define-access-token/) 
to see anything. Set this in `localStorage` from your browsers console after
`npm start`

    localStorage.setItem('accessToken', 'YOUR ACCESS TOKEN HERE')
