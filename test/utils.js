import mapboxgl from 'mapbox-gl';

export const accessToken = 'pk.eyJ1IjoiamZpcmUiLCJhIjoiZTFlNmQ3N2MzYmM2YzVjMzhkOTM2NTRhYzNiNGZiNGYifQ.1W47kmoEUpTJa3YIFefxUQ';

export function createMap() {

  var div = document.createElement('div');
  div.setAttribute('id', 'map');
  document.body.appendChild(div);

  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.height = '100%';
  document.getElementsByTagName('html')[0].style.height = '100%';
  document.getElementById('map').style.height = '100%';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v8'
  });

  return map;
}

export const features = {

  line: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [1, 1], [2, 2]]
    }
  },

  point: {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [1, 1]
    }
  },

  polygon: {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [1, 1]
      ]]
    }
  },

  square: {
    type: 'Feature',
    geometry: {
      type: 'Pol',
      coordinates: [[
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
        [1, 1]
      ]]
    }
  }

};

export function closeEnough(a, b, margin) {
  margin = margin || 0.000001;
  return Math.abs(a - b) < margin;
}
