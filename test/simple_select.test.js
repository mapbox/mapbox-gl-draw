/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { click, accessToken, createMap, features } from './test_utils';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import stub from 'sinon/lib/sinon/stub'; // avoid babel-register-related error by importing only stub
import AfterNextRender from './utils/after_next_render';
import makeMouseEvent from './utils/make_mouse_event';

mapboxgl.accessToken = accessToken;

const EVENT_TIME = 32;

var feature = features.point;

var map = createMap();
spy(map, 'fire');

var Draw = GLDraw();
map.addControl(Draw);

var afterNextRender = AfterNextRender(map);

var cleanUp = function(cb) {
  Draw.deleteAll();
  map.fire.reset();
  afterNextRender(cb);
}

var getFireArgs = function() {
  var args = [];
  for (var i=0; i<map.fire.callCount; i++) {
    args.push(map.fire.getCall(i).args);
  }
  return args;
}

// var makeMouseEvent = function(lng, lat, shiftKey = false) {
//   var e = {
//     originalEvent: {
//       shiftKey: shiftKey,
//       stopPropagation: function() {},
//       button: 0,
//       clientX: lng,
//       clientY: lat
//     },
//     point: {x: lng, y:lat},
//     lngLat: {lng: lng, lat: lat}
//   };

//   e.featureTarget = Draw.getFeatureIdsAt(lng, lat)[0];

//   return e;
// }

test('simple_select - setup', t => {
  var donedone = false;
  var done = function() {
    if (donedone === false) {
      t.pass('map loaded');
      t.end();
      donedone = true;
    }
  };
  if (map.loaded()) {
    done();
  }
  map.on('load', done);
});


test('simple_select box select', t => {
  Draw.add(features.negitivePoint);
  var id = Draw.add(features.point);
  map.fire.reset();

  afterNextRender(() => {
    map.fire('mousedown', makeMouseEvent(0, 0, true));
    map.fire('mousemove', makeMouseEvent(7, 7, true));
    map.fire('mousemove', makeMouseEvent(15, 15, true));
    map.fire('mouseup', makeMouseEvent(15, 15, true));

    afterNextRender(() => {
      var args = getFireArgs().filter(arg => arg[0] === 'draw.simple_select.selected.start');
      t.equal(args.length, 1, 'should have one and only one selected start event');
      if (args.length > 0) {
        t.equal(args[0][1].featureIds.length, 1, 'should select only one feautre');
        t.equal(args[0][1].featureIds[0], id, 'should select the feature we expect it to select');
      }
      cleanUp(() => t.end());
    });
  });
});

test('simple_select - unselect', t => {
  var id = Draw.add(features.point);
  Draw.changeMode('simple_select', [id]);
  map.fire.reset();

  afterNextRender(() => {
    map.fire('mousedown', makeMouseEvent(15, 15));
    map.fire('mouseup', makeMouseEvent(15, 15));

    afterNextRender(() => {
      var args = getFireArgs().filter(arg => arg[0] === 'draw.simple_select.selected.end');
      t.equal(args.length, 1, 'should have one and only one selected end event');
      if (args.length > 0) {
        t.equal(args[0][1].featureIds.length, 1, 'should unselect only one feautre');
        t.equal(args[0][1].featureIds[0], id, 'should unselect the feature we expect it to select');
      }
      cleanUp(() => t.end());
    });
  });
});

test('simple_select - click on an unselected feature', t => {
  var id = Draw.add(features.polygon);
  Draw.changeMode('simple_select');
  map.fire.reset();

  afterNextRender(() => {
    map.fire('mousedown', makeMouseEvent(2, 3));
    map.fire('mouseup', makeMouseEvent(2, 3));

    afterNextRender(() => {
      var args = getFireArgs();
      args = args.filter(arg => arg[0] === 'draw.simple_select.selected.start');
      t.equal(args.length, 1, 'should have one and only one selected start event');
      if (args.length > 0) {
        t.equal(args[0][1].featureIds.length, 1, 'should select only one feautre');
        t.equal(args[0][1].featureIds[0], id, 'should select the feature we expect it to select');
      }
      cleanUp(() => t.end());
    });
  });
});

// test('simple_select - click on an selected feature with shift down', t => {
//   var id = Draw.add(features.polygon);
//   Draw.changeMode('simple_select', [id]);
//   map.fire.reset();

//   afterNextRender(() => {
//     map.fire('mousedown', makeMouseEvent(3, 3, true));
//     map.fire('mouseup', makeMouseEvent(3, 3, true));

//     afterNextRender(() => {
//       var args = getFireArgs();
//       console.log(args);
//       // args = args.filter(arg => arg[0] === 'draw.simple_select.selected.end');
//       // t.equal(args.length, 1, 'should have one and only one selected end event');
//       // if (args.length > 0) {
//       //   t.equal(args[0][1].featureIds.length, 1, 'should select only one feautre');
//       //   t.equal(args[0][1].featureIds[0], id, 'should select the feature we expect it to select');
//       // }
//       cleanUp(() => t.end());
//     });
//   });
// });
