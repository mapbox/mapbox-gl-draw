/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { accessToken, createMap, features } from './utils';

mapboxgl.accessToken = accessToken;

var feature = features.point;

test('Options test', t => {
  t.test('no options', t => {
    var Draw = GLDraw();
    var defaultOptions = {
      defaultMode: 'simple_select',
      position: 'top-left',
      keybindings: true,
      displayControlsDefault: true,
      styles: Draw.options.styles,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true
      }
    };
    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('hide all controls', t => {
    var Draw = GLDraw({displayControlsDefault: false});
    var defaultOptions = {
      defaultMode: 'simple_select',
      position: 'top-left',
      keybindings: true,
      displayControlsDefault: false,
      styles: Draw.options.styles,
      controls: {
        point: false,
        line_string: false,
        polygon: false,
        trash: false
      }
    };
    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('hide all controls by default and show point', t => {
    var Draw = GLDraw({displayControlsDefault: false, controls: {point:true}});
    var defaultOptions = {
      defaultMode: 'simple_select',
      position: 'top-left',
      keybindings: true,
      displayControlsDefault: false,
      styles: Draw.options.styles,
      controls: {
        point: true,
        line_string: false,
        polygon: false,
        trash: false
      }
    };

    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('show all controls by default and hide point', t => {
    var Draw = GLDraw({displayControlsDefault: true, controls: {point:false}});
    var defaultOptions = {
      defaultMode: 'simple_select',
      position: 'top-left',
      keybindings: true,
      displayControlsDefault: true,
      styles: Draw.options.styles,
      controls: {
        point: false,
        line_string: true,
        polygon: true,
        trash: true
      }
    };

    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('custom styles', t => {
    var Draw = GLDraw({styles: [{
      'id': 'custom-polygon',
      'type': 'fill',
      'filter': ['all', ['==', '$type', 'Polygon']],
      'paint': {
        'fill-color': '#f16852'
      }
    }]});

    var styles = [
      {
        'id': 'custom-polygon.hot',
        'source': 'mapbox-gl-draw-hot',
        'type': 'fill',
        'filter': ['all', ['==', '$type', 'Polygon']],
        'paint': {
          'fill-color': '#f16852'
        }
      },
      {
        'id': 'custom-polygon.cold',
        'source': 'mapbox-gl-draw-cold',
        'type': 'fill',
        'filter': ['all', ['==', '$type', 'Polygon']],
        'paint': {
          'fill-color': '#f16852'
        }
      }
    ];

    t.deepEquals(styles, Draw.options.styles);
    t.end();
  });

});
