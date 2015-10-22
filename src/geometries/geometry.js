'use strict';

import hat from 'hat';
import { translate } from '../util';

/**
 * Base Geometry class from which other geometries inherit
 *
 * @param {Object} map - Instance of MapboxGL Map
 * @param {String} type - Type of GeoJSON geometry
 * @param {Object} [data] - GeoJSON feature
 * @returns {Geometry} this
 * @private
 */
export default class Geometry {

  constructor(map, type, data) {
    this._map = map;
    this.drawId = hat();
    this.coordinates = data.geometry.coordinates;
    var props = data.properties || {};
    props.drawId = this.drawId;

    this.geojson = {
      type: 'Feature',
      properties: props,
      geometry: {
        type: type,
        coordinates: this.coordinates
      }
    };

    this.onKeyUp = this._onKeyUp.bind(this);
  }

  /**
   * @return {Object} GeoJSON feature
   * @private
   */
  toGeoJSON() {
    this.geojson.geometry.coordinates = this.coordinates;
    return this.geojson;
  }

  /**
   * @returns Draw type
   * @private
   */
  getType() {
    return this.type;
  }

  /*
   * @returns GeoJSON type
   * @private
   */
  getGeoJSONType() {
    return this.geojson.geometry.type;
  }

  setCoordinates(coords) {
    this.coordinates = coords;
    return this;
  }

  setProperties(props) {
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
    this._map.fire('drawing.end', {
      geometry: this,
      featureType: type
    });
  }

  _onKeyUp(e) {
    const ESCAPE = 27;
    if (e.keyCode === ESCAPE) {
      this._completeDraw();
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
      this.initGeom = JSON.parse(JSON.stringify(this.toGeoJSON()));
    }

    var translatedGeom = translate(JSON.parse(
          JSON.stringify(this.initGeom)), init, curr, this._map);
    this.coordinates = translatedGeom.geometry.coordinates;
    //if (this.coordinates.get(0).length > 1) {
    // why?
    if (this.coordinates[0].length > 1) {
      //this.coordinates = this.coordinates.set(0, Immutable.List(this.coordinates.get(0)));
    }

    this._map.fire('edit.new');
  }

  _renderDrawProgress() {
    this._map.fire('new.drawing.update', {
      geojson: this.toGeoJSON()
    });
  }

}
