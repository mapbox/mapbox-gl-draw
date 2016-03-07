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
      drawing: true,
      interactive: false,
      position: 'top-left',
      keybindings: true,
      displayControlsDefault: true,
      styles: {},
      controls: {
        marker: true,
        line: true,
        shape: true,
        square: true,
        trash: true
      }
    };
    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('hide all controls', t => {
    var Draw = GLDraw({displayControlsDefault: false});
    var defaultOptions = {
      drawing: true,
      interactive: false,
      position: 'top-left',
      keybindings: true,
      displayControlsDefault: false,
      styles: {},
      controls: {
        marker: false,
        line: false,
        shape: false,
        square: false,
        trash: false
      }
    };
    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('hide all controls by default and show marker', t => {
    var Draw = GLDraw({displayControlsDefault: false, controls: {marker:true}});
    var defaultOptions = {
      drawing: true,
      interactive: false,
      position: 'top-left',
      keybindings: true,
      displayControlsDefault: false,
      styles: {},
      controls: {
        marker: true,
        line: false,
        shape: false,
        square: false,
        trash: false
      }
    };
    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('show all controls by default and hide marker', t => {
    var Draw = GLDraw({displayControlsDefault: true, controls: {marker:false}});
    var defaultOptions = {
      drawing: true,
      interactive: false,
      position: 'top-left',
      keybindings: true,
      displayControlsDefault: true,
      styles: {},
      controls: {
        marker: false,
        line: true,
        shape: true,
        square: true,
        trash: true
      }
    };
    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

});
