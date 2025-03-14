'use strict';

import Evented from '../lib/evented';
import SouthAmerica from '../fixtures/south-america.json';
import formatNumber from '../lib/format_number';
import fpsRunner from '../lib/fps';
import DragMouse from '../lib/mouse_drag';

const START = {
  x: 431,
  y: 278
};

export default class SimpleSelectLargeZoomedBenchmark extends Evented {
  constructor(options) {
    super();

    const out = options.createMap({
      width:1024,
      center: [-75.5597469696618, -2.6084634090944974],
      zoom: 5
    });

    // eslint-disable-next-line new-cap
    const dragMouse = DragMouse(START, out.map);

    const progressDiv = document.getElementById('progress');
    out.map.on('progress', (e) => {
      progressDiv.style.width = `${e.done}%`;
    });

    out.map.on('load', () => {
      out.draw.add(SouthAmerica);

      setTimeout(() => {
        this.fire('log', {message: 'normal - 29fps'});
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


