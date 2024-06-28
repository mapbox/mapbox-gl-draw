import {bboxClip} from '@turf/bbox-clip';

import Evented from '../../bench/lib/evented.js';
import { interactions } from '../../src/constants.js';

class MockMap extends Evented {
  constructor(options = {}) {
    super();

    this.sources = {};
    this.style = {
      _layers: {},
      getLayer: id => this.style._layers[id],
      addSource: (id, source) => {
        this.style._layers[id] = source;
      },
      removeSource: (id) => {
        delete this.style._layers[id];
      },
    };
    this.options = {
      container: document.createElement('div'),
      ...options
    };

    for (const interaction of interactions) {
      this[interaction] = {
        enabled: true,
        disable() { this.enabled = false; },
        enable() { this.enabled = true; },
        isEnabled() { return this.enabled; },
      };
    }

    setTimeout(() => {
      this.fire('load');
    }, 0);
  }

  addControl(control) {
    control.onAdd(this);
  }

  loaded() {
    return true;
  }

  getLayer(id) {
    return this.style.getLayer(id);
  }

  getContainer() {
    return this.options.container;
  }

  addSource(name, source) {
    this.style.addSource(name, source);
    this.sources[name] = source;
  }
  removeSource(name) {
    delete this.sources[name];
  }
  getSource(name) {
    const source = this.sources[name];
    return {
      ...source,
      setData(data) {
        source.data = data;
      }
    };
  }

  addLayer() {}

  queryRenderedFeatures([p0, p1]) {
    if (!Array.isArray(p0)) p0 = [p0.x, p0.y];
    if (!Array.isArray(p1)) p1 = [p1.x, p1.y];
    const minX = Math.min(p0[0], p1[0]);
    const minY = Math.min(p0[1], p1[1]);
    const maxX = Math.max(p0[0], p1[0]);
    const maxY = Math.max(p0[1], p1[1]);
    const bbox = [minX, minY, maxX, maxY];
    const features = [];

    for (const source of Object.values(this.sources)) {
      for (const feature of source.data.features) {
        if (feature.geometry.type === 'Point') {
          const [x, y] = feature.geometry.coordinates;
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) features.push(feature);

        } else if (feature.geometry.type === 'MultiPoint') {
          for (const [x, y] of feature.geometry.coordinates) {
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
              features.push(feature);
              break;
            }
          }

        } else {
          const clipped = bboxClip(feature, bbox);
          if (clipped.geometry.coordinates.length) features.push(feature);
        }
      }
    }
    return features;
  }
}

export default function createMap(mapOptions) {
  return new MockMap(mapOptions);
}
