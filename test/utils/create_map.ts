import { bboxClip } from '@turf/bbox-clip';
import Evented from '../../bench/lib/evented';
import { interactions } from '../../src/constants';
import type { StrictFeature } from '../../src/types/types';
import type { Polygon } from 'geojson';

type Source = {
  data: { features: StrictFeature[] };
  setData?: (data: { features: StrictFeature[] }) => void;
};

type Layer = Record<string, Source>;
type Coordinates = [number, number];

type MapOptions = {
  container?: HTMLElement;
} & Record<string, any>;

// Define the structure of an interaction
type Interaction = {
  enabled: boolean;
  disable(): void;
  enable(): void;
  isEnabled(): boolean;
};

class MockMap extends Evented {
  sources: Record<string, Source> = {};
  style: {
    _layers: Layer;
    getLayer: (id: string) => Source | undefined;
    addSource: (id: string, source: Source) => void;
    removeSource: (id: string) => void;
  };
  options: MapOptions;

  // Explicitly declare interactions for TypeScript
  scrollZoom: Interaction;
  boxZoom: Interaction;
  dragRotate: Interaction;
  dragPan: Interaction;
  keyboard: Interaction;
  doubleClickZoom: Interaction;
  touchZoomRotate: Interaction;
  
  constructor(options: MapOptions = {}) {
    super();

    this.style = {
      _layers: {},
      getLayer: (id: string) => this.style._layers[id],
      addSource: (id: string, source: Source) => {
        this.style._layers[id] = source;
      },
      removeSource: (id: string) => {
        delete this.style._layers[id];
      }
    };
    this.options = {
      container: document.createElement('div'),
      ...options
    };

    // Explicitly define each interaction
    this.scrollZoom = this.createInteraction();
    this.boxZoom = this.createInteraction();
    this.dragRotate = this.createInteraction();
    this.dragPan = this.createInteraction();
    this.keyboard = this.createInteraction();
    this.doubleClickZoom = this.createInteraction();
    this.touchZoomRotate = this.createInteraction();

    // Dynamically add any other interactions
    for (const interaction of interactions) {
      if (!(interaction in this)) {
        (this as any)[interaction] = this.createInteraction();
      }
    }

    setTimeout(() => {
      this.fire('load');
    }, 0);
  }

  // Helper function to create interaction objects
  createInteraction(): Interaction {
    return {
      enabled: true,
      disable() {
        this.enabled = false;
      },
      enable() {
        this.enabled = true;
      },
      isEnabled() {
        return this.enabled;
      }
    };
  }

  addControl(control: { onAdd: (map: MockMap) => void }) {
    control.onAdd(this);
  }

  loaded(): boolean {
    return true;
  }

  getLayer(id: string): Source | undefined {
    return this.style.getLayer(id);
  }

  getContainer(): HTMLElement {
    return this.options.container;
  }

  addSource(name: string, source: Source): void {
    this.style.addSource(name, source);
    this.sources[name] = source;
  }

  removeSource(name: string): void {
    delete this.sources[name];
  }

  getSource(name: string): Source | undefined {
    const source = this.sources[name];
    return source
      ? {
          ...source,
          setData(data: { features: StrictFeature[] }) {
            source.data = data;
          }
        }
      : undefined;
  }

  addLayer() {}

  queryRenderedFeatures([p0, p1]: [{ x: number; y: number } | Coordinates, { x: number; y: number } | Coordinates]): StrictFeature[] {
    if (!Array.isArray(p0)) p0 = [p0.x, p0.y];
    if (!Array.isArray(p1)) p1 = [p1.x, p1.y];
    const minX = Math.min(p0[0], p1[0]);
    const minY = Math.min(p0[1], p1[1]);
    const maxX = Math.max(p0[0], p1[0]);
    const maxY = Math.max(p0[1], p1[1]);
    const bbox: [number, number, number, number] = [minX, minY, maxX, maxY];
    const features: StrictFeature[] = [];

    for (const source of Object.values(this.sources)) {
      for (const feature of source.data.features) {
        if (feature.geometry.type === 'Point') {
          const [x, y] = feature.geometry.coordinates as Coordinates;
          if (x >= minX && x <= maxX && y >= minY && y <= maxY)
            features.push(feature);
        } else if (feature.geometry.type === 'MultiPoint') {
          for (const [x, y] of feature.geometry.coordinates as Coordinates[]) {
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
              features.push(feature);
              break;
            }
          }
        } else {
          const clipped = bboxClip(feature as unknown as Polygon, bbox);
          if (clipped.geometry.coordinates.length) features.push(feature);
        }
      }
    }
    return features;
  }
}

export default function createMap(mapOptions?: MapOptions): MockMap {
  return new MockMap(mapOptions);
}
