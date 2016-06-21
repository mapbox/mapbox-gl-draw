/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { click, accessToken, createMap, features } from './test_utils';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import stub from 'sinon/lib/sinon/stub'; // avoid babel-register-related error by importing only stub

mapboxgl.accessToken = accessToken;

const EVENT_TIME = 32;

var feature = features.point;

var map = createMap();
spy(map, 'fire');

var Draw = GLDraw();
map.addControl(Draw);

map.on('load', function() {
  test('simple_select box select', t => {
    Draw.add(features.negitivePoint);
    var id = Draw.add(features.point);
    map.fire.reset();

    map.on('log', function(e) {
      throw new Error('no mas logs');
    });

    setTimeout(function() {
      map.fire('mousedown', {
        originalEvent: {
            shiftKey: true,
            stopPropagation: function() {},
            button: 0,
            clientX: 0,
            clientY: 0
          },
          point: {x: 0, y:0},
          lngLat: {lng: 0, lat: 0}
      });

      map.fire('mousemove', {
        originalEvent: {
            shiftKey: true,
            stopPropagation: function() {},
            button: 0,
            clientX: 7,
            clientY: 7
          },
          point: {x: 7, y:7},
          lngLat: {lng: 7, lat: 7}
      });

      map.fire('mousemove', {
        originalEvent: {
            shiftKey: true,
            stopPropagation: function() {},
            button: 0,
            clientX: 15,
            clientY: 15
          },
          point: {x: 15, y:15},
          lngLat: {lng: 15, lat: 15}
      });

      map.fire('mouseup', {
        originalEvent: {
            shiftKey: true,
            stopPropagation: function() {},
            button: 0,
            clientX: 15,
            clientY: 15
          },
          point: {x: 15, y:15},
          lngLat: {lng: 15, lat: 15}
      });

      setTimeout(function() {
        var args = [];
        for (var i=0; i<map.fire.callCount; i++) {
          args.push(map.fire.getCall(i).args);
        }
        args = args.filter(arg => arg[0] === 'draw.simple_select.selected.start');
        t.equal(args.length, 1, 'should have one and only one selected start event');
        if (args.length > 0) {
          t.equal('draw.simple_select.selected.start', args[0][0], 'should fire select event');
          t.equal(args[0][1].featureIds.length, 1, 'should select only one feautre');
          t.equal(args[0][1].featureIds[0], id, 'should select the feature we expect it to select');
        }
        t.end();
      }, 32);
    }, 32);

  });
});

