'use strict';

import {Evented} from 'mapbox-gl/src/util/evented';
import formatNumber from '../lib/format_number';
import fpsRunner from '../lib/fps';
import DrawMouse from '../lib/mouse_draw';

const START = {x: 189, y: 293};

export default class Benchmark extends Evented {
  constructor(options) {
    super();

    const out = options.createMap();

    // eslint-disable-next-line new-cap
    const dragMouse = DrawMouse(START, out.map);

    const progressDiv = document.getElementById('progress');
    out.map.on('progress', (e) => {
      progressDiv.style.width = `${e.done}%`;
    });

    out.map.on('load', () => {
      out.draw.changeMode('draw_line_string');

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
          out.draw.changeMode('simple_select');
        });
      }, 2000);
    });
  }
}
