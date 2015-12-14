'use strict';

import hat from 'hat';
import { translate } from '../util';

/**
 * Base Geometry class which other geometries extend
 *
 * @param {Object} options
 * @param {Object} options.map - Instance of MapboxGL Map
 * @param {String} options.type - Type of GeoJSON geometry
 * @param {Object} options.data - GeoJSON feature
 * @returns {Geometry} this
 */
export default class Geometry {

  constructor(options) {
    this._map = options.map;
    this.drawId = hat();
    this.coordinates = options.data.geometry.coordinates;
    this.options = options;
    this.created = false;
    this.ready = false;

    this.geojson = {
      type: 'Feature',
      id: this.drawId,
      properties: options.data.properties || {},
      geometry: {
        type: options.type,
        coordinates: this.coordinates
      }
    };
  }

  /**
  * default onStopDrawing handler for all Geometry objects.
  * @return Null
  */

  onStopDrawing() {
    this.created = true;
  }

  /**
  * default onClick handler for all Geometry objects.
  * @return Null
  */

  onClick() { return null; }

  /**
  * default onDoubleClick handler for all Geometry objects.
  * @return Null
  */

  onDoubleClick() { return null; }

  /**
  * default onMouseMove handler for all Geometry objects.
  * @return Null
  */

  onMouseMove() { return null; }

  /**
  * default onMouseDrag handler for all Geometry objects.
  * @return Null
  */

  onMouseDrag() { return null; }

  /**
  * default onMouseDown handler for all Geometry objects.
  * @return Null
  */

  onMouseDown() { return null; }


  /**
  * default onMouseUp handler for all Geometry objects.
  * @return Null
  */

  onMouseUp() { return null; }

  /**
   * @return {Object} GeoJSON feature
   */
  toGeoJSON() {
    this.geojson.geometry.coordinates = this.coordinates;
    return JSON.parse(JSON.stringify(this.geojson));
  }

  /**
   * @returns Draw type
   */
  getType() {
    return this.type;
  }

  getOptions() {
    return this.options;
  }

  setCoordinates(coords) {
    this.coordinates = coords;
    return this;
  }

  setProperties(props) {
    props = JSON.parse(JSON.stringify(props));
    props.drawId = this.drawId;
    this.geojson.properties = props;
    return this;
  }

  /**
   * Translate this polygon
   *
   * @param {Array<Number>} init - Mouse position at the beginining of the drag
   * @param {Array<Number>} curr - Current mouse position
   */
  translate(init, curr) {
    if (!this.translating) {
      this.translating = true;
      this.initGeom = this.toGeoJSON();
    }

    var translatedGeom = translate(this.initGeom, init, curr, this._map);
    this.coordinates = translatedGeom.geometry.coordinates;
  }

}
