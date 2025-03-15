import * as Constants from './constants';
import * as modes from './modes/index';
import styles from './lib/theme';

type Controls = {
  point: boolean;
  line_string: boolean;
  polygon: boolean;
  trash: boolean;
  combine_features: boolean;
  uncombine_features: boolean;
  [key: string]: boolean;
};

type Options = {
  defaultMode?: string;
  keybindings?: boolean;
  touchEnabled?: boolean;
  clickBuffer?: number;
  touchBuffer?: number;
  boxSelect?: boolean;
  displayControlsDefault?: boolean;
  styles?: any[];
  modes?: typeof modes;
  controls?: Partial<Controls>;
  userProperties?: boolean;
  suppressAPIEvents?: boolean;
};

const defaultOptions: Options = {
  defaultMode: Constants.modes.SIMPLE_SELECT,
  keybindings: true,
  touchEnabled: true,
  clickBuffer: 2,
  touchBuffer: 25,
  boxSelect: true,
  displayControlsDefault: true,
  styles,
  modes,
  controls: {},
  userProperties: false,
  suppressAPIEvents: true
};

const showControls: Controls = {
  point: true,
  line_string: true,
  polygon: true,
  trash: true,
  combine_features: true,
  uncombine_features: true
};

const hideControls: Controls = {
  point: false,
  line_string: false,
  polygon: false,
  trash: false,
  combine_features: false,
  uncombine_features: false
};

function addSources(styles: any[], sourceBucket: 'hot' | 'cold'): any[] {
  return styles.map(style => {
    if (style.source) return style;
    return {
      ...style,
      id: `${style.id}.${sourceBucket}`,
      source: sourceBucket === 'hot' ? Constants.sources.HOT : Constants.sources.COLD
    };
  });
}

export default function configureOptions(options: Options = {}): Options {
  let withDefaults = { ...options };

  if (!options.controls) {
    withDefaults.controls = {};
  }

  withDefaults.controls = options.displayControlsDefault === false
    ? { ...hideControls, ...options.controls }
    : { ...showControls, ...options.controls };

  withDefaults = { ...defaultOptions, ...withDefaults };

  withDefaults.styles = addSources(withDefaults.styles || [], 'cold').concat(
    addSources(withDefaults.styles || [], 'hot')
  );

  return withDefaults;
}

