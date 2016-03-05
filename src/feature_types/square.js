'use strict';

import Polygon from './polygon';

/**
 * Square geometry class
 *
 * @param {Object} options
 * @param {Map} options.map - Instance of MapboxGL Map
 * @returns {Square} this
 */
export default class Square extends Polygon {

  constructor(options) {
    options.data = {
      geometry: {
        coordinates: [[[0, 0],[0, 0], [0, 0], [0, 0], [0, 0]]]
      }
    };
    options.type = 'Polygon';
    super(options);
  }

  onMouseMove(e) {
    if(this.ready) {
      var initPos = this.coordinates[0][0];
      this.coordinates[0][1] = [ initPos[0], e.lngLat.lat ];
      this.coordinates[0][2] = [ e.lngLat.lng, e.lngLat.lat ];
      this.coordinates[0][3] = [ e.lngLat.lng, initPos[1] ];
      this.coordinates[0][4] = initPos;
    }
  }

  onClick(e) {
    if(this.ready === false) {
      this.ready = true;
      var p = [ e.lngLat.lng, e.lngLat.lat ];
      this.coordinates = [[ p, p, p, p, p ]];
    }
    else {
      this.onMouseMove(e);
      this.onStopDrawing(e);
    }
  }

}
