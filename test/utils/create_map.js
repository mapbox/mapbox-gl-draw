import mapboxgl from 'mapbox-gl-js-mock';

export default function createMap(mapOptions = {}) {

  const map = new mapboxgl.Map(Object.assign({
    container: document.createElement('div'),
    style: 'mapbox://styles/mapbox/streets-v8'
  }, mapOptions));
  // Some mock project/unproject functions
  map.project = ([y, x]) => ({ x, y });
  map.unproject = ([x, y]) => ({ lng: y, lat: x });
  if (mapOptions.container) {
    map.getContainer = () => mapOptions.container;
  }

  map.getCanvas = function() {
    return map.getContainer();
  };

  let classList = [];
  const container = map.getContainer();
  container.classList.add = function(names) {
    names = names || '';
    names.split(' ').forEach(name => {
      if (classList.indexOf(name) === -1) {
        classList.push(name);
      }
    });
    container.className = classList.join(' ');
  };

  container.classList.remove = function(names) {
    names = names || '';
    names.split(' ').forEach(name => {
      classList = classList.filter(n => n !== name);
    });
    container.className = classList.join(' ');
  };

  container.className = classList.join(' ');

  container.clientLeft = 0;
  container.clientTop = 0;
  container.getBoundingClientRect = function() {
    return {
      left: 0,
      top: 0
    };
  };

  map.getContainer = function() {
    return container;
  };

  return map;
}
