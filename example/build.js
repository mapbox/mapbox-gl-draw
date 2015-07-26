(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global React, mapboxgl */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

mapboxgl.accessToken = localStorage.accessToken;

var map = new mapboxgl.Map({
  container: 'map',
  zoom: 12,
  center: [43.6579, -79.3712],
  style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json'
});

map.addControl(new mapboxgl.Navigation({
  position: 'top-left'
}));

map.addControl(mapboxgl.Draw());

var App = (function (_React$Component) {
  _inherits(App, _React$Component);

  // eslint-disable-line

  function App() {
    _classCallCheck(this, App);

    _get(Object.getPrototypeOf(App.prototype), 'constructor', this).call(this);
    this.state = {
      geojson: {
        type: 'FeatureCollection',
        features: []
      }
    };
    //this.setGeoJSON = this.setGeoJSON.bind(this);
  }

  _createClass(App, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      var _this = this;

      map.on('draw.feature.update', function (e) {
        _this.setState({ geojson: e.geojson });
      });
    }
  }, {
    key: 'setMap',
    value: function setMap(e) {
      this.setState({ geojson: JSON.parse(e.target.value) });
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { style: { height: '100%', width: '100%' } },
        React.createElement('textarea', {
          type: 'text',
          style: { height: '100%', width: '100%' },
          onChange: this.setMap,
          value: JSON.stringify(this.state.geojson, null, 4)
        })
      );
    }
  }]);

  return App;
})(React.Component);

React.render(React.createElement(App, null), document.getElementById('geojson'));

},{}]},{},[1]);
