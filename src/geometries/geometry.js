'use strict';

import hat from 'hat';
import { translate } from '../util';
import InternalEvents from '../internal_events';

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
    var props = options.data.properties || {};
    props.drawId = this.drawId;

    this.geojson = {
      type: 'Feature',
      properties: props,
      geometry: {
        type: options.type,
        coordinates: this.coordinates
      }
    };

    this.onKeyUp = this._onKeyUp.bind(this);
  }

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

  /*
   * @returns GeoJSON type
   */
  getGeoJSONType() {
    return this.geojson.geometry.type;
  }

  getDrawId() {
    return this.drawId;
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
   * Called after a draw is done
   * @private
   */
  _finishDrawing(type) {
    this._map.getContainer().removeEventListener('keyup', this.onKeyUp);
    InternalEvents.emit('drawing.end', {
      geometry: this,
      featureType: type
    });
  }

  _onKeyUp(e) {
    const ENTER = 13;
    const ESCAPE = 27;
    if (e.keyCode === ENTER) {
      this._completeDraw();
    }
    if (e.keyCode === ESCAPE) {
      this._completeDraw();
      InternalEvents.emit('drawing.cancel', { drawId: this.drawId });
    }
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

    InternalEvents.emit('edit.new', {
      id: this.drawId,
      geojson: this.toGeoJSON()
    });
  }

  _renderDrawProgress() {
    InternalEvents.emit('drawing.new.update', {
      geojson: this.toGeoJSON()
    });
  }

}
