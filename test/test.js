'use strict';

var test = require('prova');
// var mapboxgl = require('mapbox-gl');

test('gl-draw', function(t) {
  function createMap() {
    return new mapboxgl({
      container: {
        offsetWidth: 200,
        offsetHeight: 200
      }
    });
  }

  t.test('rendered', function(t) {
    console.log(createMap);
    t.end();
  });

});
