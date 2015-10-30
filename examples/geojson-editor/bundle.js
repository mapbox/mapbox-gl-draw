(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Mapbox dataset API Client
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var URL = 'https://api.mapbox.com/datasets/v1/';
var POST = 'post';

var Client = (function () {
  function Client(app, account, token) {
    _classCallCheck(this, Client);

    this.app = app;
    this.acct = account;
    this.token = token;
  }

  _createClass(Client, [{
    key: 'setAccount',
    value: function setAccount(account) {
      this.acct = account;
      if (this.token && this.acct) {
        this.list();
      }
      return this;
    }
  }, {
    key: 'getAccount',
    value: function getAccount() {
      return this.acct;
    }
  }, {
    key: 'setToken',
    value: function setToken(token) {
      this.token = token;
      if (this.token && this.acct) {
        this.list();
      }
      return this;
    }
  }, {
    key: 'getToken',
    value: function getToken() {
      return this.token;
    }
  }, {
    key: 'url',
    value: function url(params) {
      var endpoint = '';
      if (params) {
        endpoint = params.endpoint || '';
      }
      return '' + URL + this.acct + '/' + endpoint + '?access_token=' + this.token;
    }
  }, {
    key: 'list',
    value: function list() {
      var _this = this;

      fetch(this.url()).then(function (res) {
        return res.json();
      }).then(function (data) {
        _this.app.setDatasets(data);
      })['catch'](function (err) {
        console.log(err);
      });
    }
  }, {
    key: 'create',
    value: function create(name) {
      var _this2 = this;

      if (!this.acct || !this.token) return;
      fetch(this.url(), {
        method: POST,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name })
      }).then(function () {
        _this2.list();
      })['catch'](function (err) {
        console.log(err);
      });
    }
  }, {
    key: 'get',
    value: function get(id) {
      var _this3 = this;

      if (!this.acct || !this.token) return;
      fetch(this.url({ endpoint: id + '/features' })).then(function (res) {
        return res.json();
      }).then(function (data) {
        _this3.app.setFeoJSON(data);
      })['catch'](function (err) {
        console.log(err);
      });
    }
  }]);

  return Client;
})();

exports['default'] = Client;
module.exports = exports['default'];

},{}],2:[function(require,module,exports){
/* global React, map, Draw, turf */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _geojsonValidation = require('geojson-validation');

var _geojsonValidation2 = _interopRequireDefault(_geojsonValidation);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var MAPBOX = 1;
var NORM = 2;

var App = (function (_React$Component) {
  _inherits(App, _React$Component);

  // eslint-disable-line

  function App(props) {
    _classCallCheck(this, App);

    _get(Object.getPrototypeOf(App.prototype), 'constructor', this).call(this, props);
    this.state = {
      geojson: {
        type: 'FeatureCollection',
        features: []
      },
      geojsonEditPane: false,
      mode: MAPBOX,
      settings: true,
      validURL: true,
      view: 'draw',
      datasets: []
    };
    this.client = new _client2['default'](this);
    this.state.input = JSON.stringify(this.state.geojson, null, 4);
    this.state.valid = true;
    this.setMap = this.setMap.bind(this);
    this.fetchURL = this.fetchURL.bind(this);
  }

  _createClass(App, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      map.on('draw.feature.update', (function (e) {
        this.setState({
          geojson: e.geojson,
          input: JSON.stringify(e.geojson, null, 4)
        });
      }).bind(this));

      map.on('edit.feature.update', (function (e) {
        this.setState({ editting: JSON.stringify(Draw.getEditting(), null, 4) });
        if (e.geojson.features.length) this.setState({ view: 'edit' });
      }).bind(this));
    }
  }, {
    key: 'setDatasets',
    value: function setDatasets(datasets) {
      this.setState({ datasets: datasets });
    }
  }, {
    key: 'setGeoJSON',
    value: function setGeoJSON(geojson) {
      this.setState({ geojson: geojson });
    }
  }, {
    key: 'setMap',
    value: function setMap(e) {
      var _this = this;

      try {
        this.setState({
          input: e.target.value,
          geojson: JSON.parse(e.target.value),
          valid: true
        }, function () {
          if (_geojsonValidation2['default'].valid(_this.state.geojson)) {
            Draw.clear();
            Draw.set(_this.state.geojson);
          }
        });
      } catch (err) {
        this.setState({
          input: e.target.value,
          valid: false
        });
      }
    }
  }, {
    key: 'fetchURL',
    value: function fetchURL(e) {
      var _this2 = this;

      fetch(e.target.value).then(function (res) {
        try {
          return res.json();
        } catch (err) {
          _this2.setState({ validURL: false });
          console.log('could not parse json');
        }
      }).then(function (data) {
        _this2.setState({ validURL: true, view: 'draw' });
        Draw.clear().set(data);
        var ext = turf.extent(data);
        map.fitBounds([[ext[0], ext[1]], [ext[2], ext[3]]]);
      })['catch'](function (err) {
        console.log(err);
        _this2.setState({ validURL: false });
      });
    }
  }, {
    key: 'toggleSettings',
    value: function toggleSettings() {
      this.setState({ settings: !this.state.settings });
    }
  }, {
    key: 'toggleGeojsonEditPane',
    value: function toggleGeojsonEditPane() {
      this.setState({ geojsonEditPane: !this.state.geojsonEditPane });
    }
  }, {
    key: 'toggleView',
    value: function toggleView(view) {
      this.setState({ view: view });
    }
  }, {
    key: 'setMode',
    value: function setMode(mode) {
      this.setState({ mode: mode });
    }
  }, {
    key: 'setToken',
    value: function setToken(e) {
      this.client.setToken(e.target.value);
    }
  }, {
    key: 'setAccount',
    value: function setAccount(e) {
      this.client.setAccount(e.target.value);
    }
  }, {
    key: 'createDataset',
    value: function createDataset() {
      this.client.create(this.refs['newDatasetName'].getDOMNode().value); // eslint-disable-line dot-notation
    }
  }, {
    key: 'editDataset',
    value: function editDataset(id) {
      this.client.get(id);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      var input = this.state.input;
      return React.createElement(
        'div',
        { className: 'side-bar' },
        React.createElement(
          'div',
          { className: 'clearfix col12 pad1', onClick: this.toggleSettings.bind(this) },
          React.createElement('span', { className: 'col1 icon sprocket' }),
          React.createElement(
            'h3',
            { className: 'col10' },
            'Control Panel'
          ),
          React.createElement('span', { className: 'col1 icon caret-' + (this.state.settings ? 'down' : 'left') })
        ),
        this.state.settings && React.createElement(
          'div',
          null,
          React.createElement(
            'div',
            { className: 'col12 clearfix' },
            React.createElement(
              'div',
              {
                className: 'col6 center pad1 ' + (this.state.mode === MAPBOX && 'fill-darken1'),
                onClick: this.setMode.bind(this, MAPBOX)
              },
              'Mapbox'
            ),
            React.createElement(
              'div',
              {
                className: 'col6 center pad1 ' + (this.state.mode === NORM && 'fill-darken1'),
                onClick: this.setMode.bind(this, NORM)
              },
              'Fetch'
            )
          ),
          this.state.mode === MAPBOX && React.createElement(
            'div',
            null,
            React.createElement(
              'fieldset',
              { className: 'with-icon dark' },
              React.createElement('span', { className: 'icon mapbox' }),
              React.createElement('input', {
                placeholder: 'Mapbox Username',
                type: 'text',
                className: 'stretch',
                onChange: this.setAccount.bind(this)
              })
            ),
            React.createElement(
              'fieldset',
              { className: 'with-icon dark' },
              React.createElement('span', { className: 'icon lock' }),
              React.createElement('input', {
                placeholder: 'Mapbox Dataset API access token',
                type: 'text',
                className: 'stretch',
                onChange: this.setToken.bind(this)
              })
            ),
            React.createElement(
              'div',
              null,
              React.createElement(
                'h3',
                null,
                'My Datasets'
              ),
              React.createElement(
                'div',
                null,
                this.state.datasets.map(function (set) {
                  return React.createElement(
                    'div',
                    { className: 'clearfix col12 pad2x' },
                    React.createElement(
                      'div',
                      { className: 'col11' },
                      set.id
                    ),
                    React.createElement('span', { onClick: _this3.editDataset.bind(_this3, set.id), className: 'col1 icon pencil' })
                  );
                })
              )
            ),
            React.createElement(
              'div',
              null,
              React.createElement(
                'h3',
                null,
                'Create New Dataset'
              ),
              React.createElement('input', {
                placeholder: 'Data set name',
                type: 'text',
                className: 'stretch',
                ref: 'newDatasetName'
              }),
              React.createElement(
                'button',
                { className: 'button', onClick: this.createDataset.bind(this) },
                'Create'
              )
            )
          ),
          this.state.mode === NORM && React.createElement(
            'div',
            null,
            React.createElement(
              'fieldset',
              { className: 'with-icon dark ' + (!this.state.validURL && 'fill-red') },
              React.createElement('span', { className: 'icon search' }),
              React.createElement('input', {
                placeholder: 'Fetch data from URL',
                type: 'text',
                className: 'url-input stretch ' + (!this.state.validURL && 'fill-red'),
                onChange: this.fetchURL
              })
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'clearfix col12 pad1', onClick: this.toggleGeojsonEditPane.bind(this) },
          React.createElement('span', { className: 'col1 icon pencil' }),
          React.createElement(
            'h3',
            { className: 'col10' },
            'Editor'
          ),
          React.createElement('span', { className: 'col1 icon caret-' + (this.state.geojsonEditPane ? 'down' : 'left') })
        ),
        this.state.geojsonEditPane && React.createElement(
          'div',
          { className: 'clearfix' },
          React.createElement(
            'div',
            { className: 'rounded-toggle col12 inline' },
            React.createElement('input', {
              id: 'draw',
              type: 'radio',
              name: 'rtoggle',
              value: 'draw',
              checked: this.state.view === 'draw' && 'checked'
            }),
            React.createElement(
              'label',
              {
                'for': 'draw',
                className: 'col6 center',
                onClick: this.toggleView.bind(this, 'draw')
              },
              'Drawn'
            ),
            React.createElement('input', {
              id: 'edit',
              type: 'radio',
              name: 'rtoggle',
              value: 'edit',
              checked: this.state.view === 'edit' && 'checked'
            }),
            React.createElement(
              'label',
              {
                'for': 'edit',
                className: 'col6 center',
                onClick: this.toggleView.bind(this, 'edit')
              },
              'Editting'
            )
          ),
          this.state.view === 'draw' && React.createElement('textarea', {
            type: 'text',
            className: 'geojson-input fill-navy dark',
            onChange: this.setMap,
            value: input
          }),
          this.state.view === 'edit' && React.createElement('textarea', {
            type: 'text',
            className: 'geojson-input fill-navy dark',
            value: this.state.editting
          })
        )
      );
    }
  }]);

  return App;
})(React.Component);

React.render(React.createElement(App, null), document.getElementById('geojson'));

},{"./client":1,"geojson-validation":3}],3:[function(require,module,exports){
/**
* geoJSON validation according to the GeoJSON spefication Version 1
* @module geoJSONValidation
* @class Main
* @exports {GJV} 
*/

(function(exports){

    var definitions = {};

    /**
     * Test an object to see if it is a function
     * @method isFunction 
     * @param object {Object}
     * @return {Boolean}
     */
    function isFunction(object) {
        return typeof(object) == 'function';
    }
    
    /**
     * A truthy test for objects
     * @method isObject
     * @param {Object}
     * @return {Boolean}
     */
    function isObject(object) {
        return object === Object(object);
    }

    /**
     * Formats error messages, calls the callback
     * @method done
     * @private
     * @param cb {Function} callback
     * @param [message] {Function} callback
     * @return {Boolean} is the object valid or not?
     */
    function _done(cb, message){
        var valid = false;

        if(typeof message === "string"){
            message = [message];

        }else if( Object.prototype.toString.call( message ) === '[object Array]' ) {
            if(message.length === 0){
                valid = true;
            }
        }else{
            valid = true;
        }

        if( isFunction(cb)){
            if(valid){
                cb(valid, []);
            }else{
                cb(valid, message);
            }
        }

        return valid;
    }

    /**
     * calls a custom definition if one is avalible for the given type
     * @method _customDefinitions 
     * @private
     * @param type {"String"} a GeoJSON object type
     * @param object {Object} the Object being tested 
     * @return {Array} an array of errors
     */
    function _customDefinitions(type, object){

        var errors;

        if(isFunction(definitions[type])){
            try{
                errors = definitions[type](object);
            }catch(e){
                errors = ["Problem with custom definition for '" + type + ": " + e];
            }
            if(typeof result === "string"){
                errors = [errors];
            }
            if(Object.prototype.toString.call( errors ) === '[object Array]'){
                return errors;
            }
        }
        return [];
    }

    /**
     * Define a custom validation function for one of GeoJSON objects
     * @method define 
     * @param type {GeoJSON Type} the type 
     * @param definition {Function} A validation function
     * @return {Boolean} Return true if the function was loaded corectly else false
     */
    exports.define = function(type, definition){
        if((type in all_types) && isFunction(definition)){
            //TODO: check to see if the type is valid
            definitions[type] = definition;
            return true;
        }
        return false;
    };

    /**
     * Determines if an object is a position or not
     * @method isPosition 
     * @param position {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isPosition = function(position, cb){

        var errors = [];

        //It must be an array
        if(Array.isArray(position)){
            //and the array must have more than one element
            if(position.length <= 1){
                errors.push("Position must be at least two elements");
            }
        }else{
            errors.push("Position must be an array");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Position", position));

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a GeoJSON Object or not
     * @method isGeoJSONObject|valid
     * @param geoJSONObject {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isGeoJSONObject = exports.valid = function(geoJSONObject, cb){

        if(!isObject(geoJSONObject)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];
        if('type' in geoJSONObject){
            if(non_geo_types[geoJSONObject.type]){
                return non_geo_types[geoJSONObject.type](geoJSONObject, cb);
            }else if(geo_types[geoJSONObject.type]){
                return geo_types[geoJSONObject.type](geoJSONObject, cb);
            }else{
                errors.push('type must be one of: "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection", "Feature", or "FeatureCollection"');
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("GeoJSONObject", geoJSONObject));
        return _done(cb, errors);
    };

    /**
     * Determines if an object is a Geometry Object or not
     * @method isGeometryObject
     * @param geometryObject {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isGeometryObject = function(geometryObject, cb){

        if(!isObject(geometryObject)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('type' in geometryObject){
            if(geo_types[geometryObject.type]){
                return geo_types[geometryObject.type](geometryObject, cb);
            }else{
                errors.push('type must be one of: "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon" or "GeometryCollection"');
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("GeometryObject", geometryObject));
        return _done(cb, errors);
    };

    /**
     * Determines if an object is a Point or not
     * @method isPoint
     * @param point {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isPoint = function(point, cb) {

        if(!isObject(point)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in point){
            exports.isBbox(point.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in point){
            if(point.type !== "Point"){
                errors.push("type must be 'Point'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in point){
            exports.isPosition(point.coordinates, function(valid, err){
                if(!valid){
                    errors.push('Coordinates must be a single position');
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Point", point));

        return _done(cb, errors);
    };

    /**
     * Determines if an array can be interperted as coordinates for a MultiPoint
     * @method isMultiPointCoor
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiPointCoor = function(coordinates, cb) {

        var errors = [];

        if(Array.isArray(coordinates)){
            coordinates.forEach(function(val, index){
                exports.isPosition(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalide positions
                        errors = errors.concat(err);
                    }
                });
            });
        }else{
            errors.push("coordinates must be an array");
        }

        return _done(cb, errors);
    };
    /**
     * Determines if an object is a MultiPoint or not
     * @method isMultiPoint
     * @param position {Object}
     * @param cb {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiPoint = function(multiPoint, cb) {

        if(!isObject(multiPoint)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in multiPoint){
            exports.isBbox(multiPoint.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in multiPoint){
            if(multiPoint.type !== "MultiPoint"){
                errors.push("type must be 'MultiPoint'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in multiPoint){
            exports.isMultiPointCoor(multiPoint.coordinates, function(valid, err){
                if(!valid){
                    errors =  errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("MultiPoint", multiPoint));

        return _done(cb, errors);
    };

    /**
     * Determines if an array can be interperted as coordinates for a lineString
     * @method isLineStringCoor
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isLineStringCoor = function(coordinates, cb) {

        var errors = [];
        if(Array.isArray(coordinates)){
            if(coordinates.length > 1){
                coordinates.forEach(function(val, index){
                    exports.isPosition(val, function(valid, err){
                        if(!valid){
                            //modify the err msg from "isPosition" to note the element number
                            err[0] = "at "+ index+ ": ".concat(err[0]);
                            //build a list of invalide positions
                            errors = errors.concat(err);
                        }
                    });
                });
            }else{
                errors.push("coordinates must have at least two elements");
            }
        }else{
            errors.push( "coordinates must be an array");
        }

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a lineString or not
     * @method isLineString
     * @param lineString {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isLineString = function(lineString, cb){

        if(!isObject(lineString)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in lineString){
            exports.isBbox(lineString.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in lineString){
            if(lineString.type !== "LineString"){
                errors.push("type must be 'LineString'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in lineString){
            exports.isLineStringCoor(lineString.coordinates, function(valid, err){
                if(!valid){
                    errors =  errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("LineString", lineString));

        return _done(cb, errors);
    };

    /**
     * Determines if an array can be interperted as coordinates for a MultiLineString
     * @method isMultiLineStringCoor
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiLineStringCoor = function(coordinates, cb) {
        var errors = [];
        if(Array.isArray(coordinates)){
            coordinates.forEach(function(val, index){
                exports.isLineStringCoor(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalide positions
                        errors = errors.concat(err);
                    }
                });
            });
        }else{
            errors.push("coordinates must be an array");
        }
        _done(cb, errors);
    };

    /**
     * Determines if an object is a MultiLine String or not
     * @method isMultiLineString
     * @param multilineString {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiLineString = function(multilineString, cb){

        if(!isObject(multilineString)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in multilineString){
            exports.isBbox(multilineString.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in multilineString){
            if(multilineString.type !== "MultiLineString"){
                errors.push("type must be 'MultiLineString'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in multilineString){
            exports.isMultiLineStringCoor(multilineString.coordinates, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("MultiPoint", multilineString));

        return _done(cb, errors);
    };

    /**
     * Determines if an array is a linear Ring String or not
     * @method isMultiLineString
     * @private
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    function _linearRingCoor(coordinates, cb) {

        var errors = [];
        if(Array.isArray(coordinates)){
            //4 or more positions

            coordinates.forEach(function(val, index){
                exports.isPosition(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalide positions
                        errors = errors.concat(err);
                    }
                });
            });

            // check the first and last positions to see if they are equivalent
            // TODO: maybe better checking?
            if(coordinates[0].toString() !== coordinates[coordinates.length -1 ].toString()){
                errors.push( "The first and last positions must be equivalent");
            }

            if(coordinates.length < 4){
                errors.push("coordinates must have at least four positions");
            }
        }else{
            errors.push("coordinates must be an array");
        }

        return _done(cb, errors);
    }

    /**
     * Determines if an array is valid Polygon Coordinates or not
     * @method _polygonCoor
     * @private
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isPolygonCoor = function (coordinates, cb){

        var errors = [];
        if(Array.isArray(coordinates)){
            coordinates.forEach(function(val, index){
                _linearRingCoor(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalid positions
                        errors = errors.concat(err);
                    }
                });
            });
        }else{
            errors.push("coordinates must be an array");
        }

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a valid Polygon
     * @method isPolygon
     * @param polygon {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isPolygon = function(polygon, cb){

        if(!isObject(polygon)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in polygon){
            exports.isBbox(polygon.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in polygon){
            if(polygon.type !== "Polygon"){
                errors.push("type must be 'Polygon'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in polygon){
            exports.isPolygonCoor(polygon.coordinates, function(valid, err) {
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Polygon", polygon));

        return _done(cb, errors);
    };

    /**
     * Determines if an array can be interperted as coordinates for a MultiPolygon
     * @method isMultiPolygonCoor
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiPolygonCoor = function(coordinates, cb) {
        var errors = [];
        if(Array.isArray(coordinates)){
            coordinates.forEach(function(val, index){
                exports.isPolygonCoor(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalide positions
                        errors = errors.concat(err);
                    }
                });
            });
        }else{
            errors.push("coordinates must be an array");
        }

        _done(cb, errors);
    };

    /**
     * Determines if an object is a valid MultiPolygon
     * @method isMultiPolygon
     * @param multiPolygon {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiPolygon = function(multiPolygon, cb){

        if(!isObject(multiPolygon)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in multiPolygon){
            exports.isBbox(multiPolygon.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in multiPolygon){
            if(multiPolygon.type !== "MultiPolygon"){
                errors.push("type must be 'MultiPolygon'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in multiPolygon){
            exports.isMultiPolygonCoor(multiPolygon.coordinates, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("MultiPolygon", multiPolygon));

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a valid Geometry Collection
     * @method isGeometryCollection
     * @param geometryCollection {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isGeometryCollection = function(geometryCollection, cb){

        if(!isObject(geometryCollection)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in geometryCollection){
            exports.isBbox(geometryCollection.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in geometryCollection){
            if(geometryCollection.type !== "GeometryCollection"){
                errors.push("type must be 'GeometryCollection'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('geometries' in geometryCollection){
            if(Array.isArray(geometryCollection.geometries)){
                geometryCollection.geometries.forEach(function(val, index){
                    exports.isGeometryObject(val, function(valid, err){
                        if(!valid){
                            //modify the err msg from "isPosition" to note the element number
                            err[0] = "at "+ index+ ": ".concat(err[0]);
                            //build a list of invalide positions
                            errors = errors.concat(err);
                        }
                    });
                });
            }else{
                errors.push("'geometries' must be an array");
            }
        }else{
            errors.push("must have a member with the name 'geometries'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("GeometryCollection", geometryCollection));

        return _done( cb, errors);
    };

    /**
     * Determines if an object is a valid Feature
     * @method isFeature
     * @param feature {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isFeature = function(feature, cb){

        if(!isObject(feature)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in feature){
            exports.isBbox(feature.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in feature){
            if(feature.type !== "Feature"){
                errors.push("type must be 'feature'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if(!('properties' in feature)){
            errors.push("must have a member with the name 'properties'");
        }

        if('geometry' in feature){
            if(feature.geometry !== null){
                exports.isGeometryObject(feature.geometry, function(valid, err){
                    if(!valid){
                        errors = errors.concat(err);
                    }
                });
            }
        }else{
            errors.push("must have a member with the name 'geometry'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Feature", feature));

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a valid Feature Collection
     * @method isFeatureCollection
     * @param featureCollection {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isFeatureCollection = function(featureCollection, cb){

        if(!isObject(featureCollection)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in featureCollection){
            exports.isBbox(featureCollection.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in featureCollection){
            if(featureCollection.type !== "FeatureCollection"){
                errors.push("type must be 'FeatureCollection'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('features' in featureCollection){
            if(Array.isArray(featureCollection.features)){
                featureCollection.features.forEach(function(val, index){
                    exports.isFeature(val, function(valid, err){
                        if(!valid){
                            //modify the err msg from "isPosition" to note the element number
                            err[0] = "at "+ index+ ": ".concat(err[0]);
                            //build a list of invalide positions
                            errors = errors.concat(err);
                        }
                    });
                });
            }else{
                errors.push("'features' must be an array");
            }
        }else{
            errors.push("must have a member with the name 'features'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("FeatureCollection", featureCollection));

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a valid Bounding Box
     * @method isBbox
     * @param bbox {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isBbox = function(bbox, cb){
        var errors = [];
        if(Array.isArray(bbox)){
            if(bbox.length % 2 !== 0){
                errors.push("bbox, must be a 2*n array");
            }
        }else{
            errors.push("bbox must be an array");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Bbox", bbox));

        _done(cb,errors);
    };

    var non_geo_types = {
        "Feature": exports.isFeature,
        "FeatureCollection": exports.isFeatureCollection
    },

    geo_types = {
        "Point": exports.isPoint,
        "MultiPoint": exports.isMultiPoint,
        "LineString": exports.isLineString,
        "MultiLineString": exports.isMultiLineString,
        "Polygon": exports.isPolygon,
        "MultiPolygon": exports.isMultiPolygon,
        "GeometryCollection": exports.isGeometryCollection,
    },

    all_types = {
        "Feature": exports.isFeature,
        "FeatureCollection": exports.isFeatureCollection,
        "Point": exports.isPoint,
        "MultiPoint": exports.isMultiPoint,
        "LineString": exports.isLineString,
        "MultiLineString": exports.isMultiLineString,
        "Polygon": exports.isPolygon,
        "MultiPolygon": exports.isMultiPolygon,
        "GeometryCollection": exports.isGeometryCollection,
        "Bbox": exports.isBox,
        "Position": exports.isPosition,
        "GeoJSON": exports.isGeoJSONObject,
        "GeometryObject": exports.isGeometryObject
    };

    exports.all_types = all_types;

})(typeof exports === 'undefined'? this['GJV']={}: exports);

},{}]},{},[2]);
