/* global mapboxgl, MapboxGeocoder, MapboxDraw */

const StaticMode = {};

StaticMode.onSetup = function() {
  this.setActionableState(); // default actionable state is false for all actions
  return {};
};

StaticMode.toDisplayFeatures = function(state, geojson, display) {
  display(geojson);
};

// Parse the access_token out of the url
const args = location.search.replace(/^\?/, '').split('&').reduce((o, param) => {
  const keyvalue = param.split('=');
  o[keyvalue[0]] = keyvalue[1];
  return o;
}, {});

mapboxgl.accessToken = args.access_token || localStorage.accessToken;

const map = new mapboxgl.Map({
  container: 'map',
  zoom: 1,
  center: [0, 0],
  style: 'mapbox://styles/mapbox/streets-v8'
});

map.addControl(new MapboxGeocoder({
  accessToken: mapboxgl.accessToken
}));

map.addControl(new mapboxgl.NavigationControl(), 'top-left');

const modes = MapboxDraw.modes;
modes.static = StaticMode;
const Draw = window.Draw = new MapboxDraw({ modes });
let drawIsActive = true;
map.addControl(Draw, 'bottom-right');

map.on('load', () => {

  // Add Draw to the map if it is inactive
  const addButton = document.getElementById('addBtn');
  addButton.onclick = function() {
    if (drawIsActive) return;
    drawIsActive = true;
    map.addControl(Draw, 'bottom-right');
  };

  // Remove draw from the map if it is active
  const removeButton = document.getElementById('removeBtn');
  removeButton.onclick = function() {
    if (!drawIsActive) return;
    drawIsActive = false;
    map.removeControl(Draw);
  };

  // Toggle the style between dark and streets
  const flipStyleButton = document.getElementById('flipStyleBtn');
  let currentStyle = 'streets-v9';
  flipStyleButton.onclick = function() {
    const style = currentStyle === 'streets-v9' ? 'dark-v9' : 'streets-v9';
    map.setStyle(`mapbox://styles/mapbox/${style}`);
    currentStyle = style;
  };

  // toggle double click zoom
  const doubleClickZoom = document.getElementById('doubleClickZoom');
  let doubleClickZoomOn = true;
  doubleClickZoom.onclick = function() {
    if (doubleClickZoomOn) {
      doubleClickZoomOn = false;
      map.doubleClickZoom.disable();
      doubleClickZoom.innerText = 'enable dblclick zoom';
    } else {
      map.doubleClickZoom.enable();
      doubleClickZoomOn = true;
      doubleClickZoom.innerText = 'disable dblclick zoom';
    }
  };

  // Jump into draw point mode via a custom UI element
  const startPoint = document.getElementById('start-point');
  startPoint.onclick = function() {
    Draw.changeMode('draw_point');
  };

  // Jump into draw line mode via a custom UI element
  const startLine = document.getElementById('start-line');
  startLine.onclick = function() {
    Draw.changeMode('draw_line_string');
  };

  // Jump into draw polygon mode via a custom UI element
  const startPolygon = document.getElementById('start-polygon');
  startPolygon.onclick = function() {
    Draw.changeMode('draw_polygon');
  };

  // Jump into static mode via a custom UI element
  const startStatic = document.getElementById('start-static');
  startStatic.onclick = function() {
    Draw.changeMode('static');
  };

});
