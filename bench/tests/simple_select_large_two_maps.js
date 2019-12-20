'use strict';

import {Evented} from 'mapbox-gl/src/util/evented';
import SouthAmerica from '../fixtures/south-america.json';
import formatNumber from '../lib/format_number';
import fpsRunner from '../lib/fps';
import DragMouse from '../lib/mouse_drag';

const START = {
  x: 431,
  y: 278
};

const emptyStyle = {
  "version": 8,
  "name": "Empty",
  "center": [
    0,
    -1.1368683772161603e-13
  ],
  "zoom": 0.4051413497691584,
  "bearing": 0,
  "pitch": 0,
  "sources": {},
  "layers": [],
};

export default class SimpleSelectLargeTwoMapsBenchmark extends Evented {
  constructor(options) {
    super();
    // eslint-disable-next-line no-unused-vars
    const background = options.createMap({'container': 'backmap', width:1024});
    const out = options.createMap({width: 1024, style: emptyStyle});

    const progressDiv = document.getElementById('progress');
    out.map.on('progress', (e) => {
      progressDiv.style.width = `${e.done}%`;
    });

    // eslint-disable-next-line new-cap
    const dragMouse = DragMouse(START, out.map);

    out.map.on('load', () => {
      out.draw.add(SouthAmerica);

      setTimeout(() => {
        this.fire('log', {message: 'normal - 43fps'});
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


