'use strict';

var test = require('prova');
var mapboxgl = require('mapbox-gl').Map;
// var Draw = require('../index');

function createMap() {
  return new mapboxgl({
    container: {
      offsetWidth: 200,
      offsetHeight: 200,
      classList: {
        add: function() {}
      }
    },
    interactive: false,
    attributionControl: false
  });
}

test('rendered', function(t) {
  var map = createMap();
  // map.addControl(Draw());

  t.ok(map.getContainer());
  t.end();
});
