/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { click, accessToken, createMap, features } from './test_utils';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy

mapboxgl.accessToken = accessToken;

const EVENT_TIME = 32;

var feature = features.point;

var map = createMap();
spy(map, 'fire');

var Draw = GLDraw();
map.addControl(Draw);

test('draw.modified is fired when placing a point', t => {
  Draw.deleteAll();
  Draw.changeMode('draw_point');
  map.fire.reset();
  click(map, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 0, y:0},
      lngLat: {lng: 0, lat: 0}
  });

  t.equal(4, map.fire.callCount, '4 events expected to be fired');
  t.equal('mousedown', map.fire.getCall(0).args[0], 'mousedown was emitted');
  t.equal('mouseup', map.fire.getCall(1).args[0], 'moseup was emitted');
  t.equal('draw.modechange', map.fire.getCall(2).args[0], 'change mode was emitted');
  t.equal('draw.modified', map.fire.getCall(3).args[0], 'draw.modified was emitted');
  t.end();
});

test('draw.modified is fired when drawing a line_string', t => {
  Draw.deleteAll();
  Draw.changeMode('draw_line_string');
  map.fire.reset();
  click(map, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 0, y:0},
      lngLat: {lng: 0, lat: 0}
  });

  click(map, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 5, y:0},
      lngLat: {lng: 5, lat: 0}
  });

  click(map, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 0, y:5},
      lngLat: {lng: 0, lat: 5}
  });


  t.test('draw.modified should not be called when the feature is invalid', t => {
    var events = [
      'mousedown',
      'mouseup',
      'mousedown',
      'mouseup',
      'draw.modified',
      'mousedown',
      'mouseup',
      'draw.modified'
    ];

    events.forEach((event, i) => {
      var args = map.fire.getCall(i).args;
      t.equal(event, args[0], `${event} was called ${i+1}`);
    });
    t.end();
  });

  t.end();
});

test('draw.modified is fired when making a polygon', t => {
  Draw.deleteAll();
  Draw.changeMode('draw_polygon');
  map.fire.reset();
  click(map, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 0, y:0},
      lngLat: {lng: 0, lat: 0}
  });

  click(map, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 5, y:0},
      lngLat: {lng: 5, lat: 0}
  });

  click(map, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 0, y:5},
      lngLat: {lng: 0, lat: 5}
  });

  click(map, {
    originalEvent: {
        isShiftKey: false,
        stopPropagation: function() {}
      },
      point: {x: 5, y:5},
      lngLat: {lng: 5, lat: 5}
  });

  t.test('draw.modified should not be called when the feature is invalid', t => {
    var events = [
      'mousedown',
      'mouseup',
      'mousedown',
      'mouseup',
      'mousedown',
      'mouseup',
      'draw.modified',
      'mousedown',
      'mouseup',
      'draw.modified'
    ];

    events.forEach((event, i) => {
      var args = map.fire.getCall(i).args;
      t.equal(event, args[0], `${event} was called ${i+1}`);
    });
    t.end();
  });

  t.end();
});

test('draw.direct_select event', t => {
  let id = Draw.add(feature);
  t.throws(() => Draw.changeMode('direct_select', {featureId: id}), 'should throw on a point');
  Draw.delete(id);
  t.end();
});

test('draw.deleted event', t => {
  let id = Draw.add(feature);
  map.fire.reset();
  Draw.delete(id);
  setTimeout(function() {
    var event = map.fire.getCall(0).args;
    t.equal('draw.deleted', event[0], 'deleted was emitted');
    t.equal(1, event[1].featureIds.length, 'the right number of features were deleted');
    // this event is weird, need to fix
    //t.equal(id, event[1].featureIds[0]);

    let numCalls = map.fire.callCount;
    for(var i=0; i<numCalls; i++) {
      var args = map.fire.getCall(i).args;
      t.notEqual('draw.modified', args[0], 'draw.modified was never called');
    }

    Draw.remove();
    t.end();
  }, EVENT_TIME);
});
