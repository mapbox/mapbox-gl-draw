var mapboxgl = require('mapbox-gl');
var GLDraw = require('../../index.js');

mapboxgl.accessToken = 'pk.eyJ1Ijoia2VsdmluYWJyb2t3YSIsImEiOiJkcUF1TWlVIn0.YzBtz0O019DJGk3IpFi72g';

var div = document.createElement('div');
div.setAttribute('id', 'map');
document.body.appendChild(div);

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v8'
});

map.addControl(new mapboxgl.Navigation({
  position: 'top-left'
}));

var Draw = GLDraw();
map.addControl(Draw);
