import { modes, meta } from '../constants';
import type { Layer } from 'mapbox-gl';

export interface Controls {
  point: boolean;
  line_string: boolean;
  polygon: boolean;
  trash: boolean;
  combine_features: boolean
  uncombine_features: boolean
}

export interface DrawLayer extends Layer {
  meta: typeof meta[keyof typeof meta];
  mode: typeof modes[keyof typeof modes];
  active: boolean;
}
