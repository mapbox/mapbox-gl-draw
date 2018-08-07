#!/bin/bash
export NODE_ENV=production 

# Create ES5 versions of each of the source files
npx babel ./src -d ./dist/

# Also create an ES5 version of the index file. It has a bunch of `require`
# statements that look like `require('./src/stuff')`; we rewrite them to
# `require('./stuff')` to fit into our new structure.
sed 's/\.\/src\//\.\//' < index.js > dist/index.js

browserify index.js --standalone MapboxDraw > dist/mapbox-gl-draw.js
