'use strict';

import {Evented} from 'mapbox-gl/src/util/evented';
import SouthAmerica from '../fixtures/south-america.json';
import formatNumber from '../lib/format_number';
import fpsRunner from '../lib/fps';
import DragMouse from '../lib/mouse_drag';

const START = {
  x: 174,
  y: 300
};

export default class SimpleSelectSmallBenchmark extends Evented {
  constructor(options) {
    super();
    const out = options.createMap();

    // eslint-disable-next-line new-cap
    const dragMouse = DragMouse(START, out.map);

    const progressDiv = document.getElementById('progress');
    out.map.on('progress', (e) => {
      progressDiv.style.width = `${e.done}%`;
    });

    out.map.on('load', () => {
      out.draw.add(SouthAmerica);

      setTimeout(() => {
        const FPSControl = fpsRunner();
        FPSControl.start();
        dragMouse(() => {
          const fps = FPSControl.stop();
          if (fps < 55) {
            this.fire('fail', {message: `${formatNumber(fps)} fps - expected 55fps or better`});
          } else {
            this.fire('pass', {message: `${formatNumber(fps)} fps`});
          }
        });
      }, 2000);
    });
  }
}
