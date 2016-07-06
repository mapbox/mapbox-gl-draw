/* eslint no-shadow:[0] */
import test from 'tape';
import GLDraw from '../';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import AfterNextRender from './utils/after_next_render';
import makeMouseEvent from './utils/make_mouse_event';
import getGeoJSON from './utils/get_geojson';
import createMap from './utils/create_map';
import Constants from '../src/constants';

test('static', t => {

  var map = createMap();
  spy(map, 'fire');
  map.dragPan.disable.restore();
  spy(map.dragPan, 'disable');

  var Draw = GLDraw();
  map.addControl(Draw);

  var afterNextRender = AfterNextRender(map);

  var cleanUp = function(cb) {
    Draw.deleteAll();
    map.fire.reset();
    if (cb) cb();
  };

  var getFireArgs = function() {
    var args = [];
    for (var i = 0; i < map.fire.callCount; i++) {
      args.push(map.fire.getCall(i).args);
    }
    return args;
  };

  t.test('static - init map for tests', t => {
    var done = function() {
      map.off('load', done);
      t.end();
    };
    if (map.loaded()) {
      done();
    }
    else {
      map.on('load', done);
    }
  });


  t.test('static - box select', t => {
    Draw.add(getGeoJSON('negativePoint'));
    Draw.add(getGeoJSON('point'));
    Draw.changeMode(Constants.modes.STATIC);
    map.fire.reset();

    afterNextRender(() => {
      map.dragPan.disable.reset();
      map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
      t.equal(map.dragPan.disable.callCount, 0, 'dragPan is still enabled');
      map.fire('mousemove', makeMouseEvent(15, 15, { shiftKey: true }));
      map.fire('mouseup', makeMouseEvent(15, 15, { shiftKey: true }));

      var args = getFireArgs().filter(arg => arg[0] === 'draw.selectionchange');
      t.equal(args.length, 0, 'should have zero selectionchange events');
      cleanUp(t.end);
    });
  });

   t.test('static - try clicking many features', t => {
    var features = [getGeoJSON('point'), getGeoJSON('line'), getGeoJSON('square')];
    Draw.add({
      type: 'FeatureCollection',
      features: features
    });
    map.fire.reset();

    afterNextRender(() => {
      map.fire('mousedown', makeMouseEvent(10, 10));
      map.fire('mouseup', makeMouseEvent(10, 10));
      map.fire('mousemove', makeMouseEvent(1.5, 1.5));
      map.fire('mouseup', makeMouseEvent(1.5, 1.5));
      map.fire('mousemove', makeMouseEvent(1, 1));
      map.fire('mouseup', makeMouseEvent(1, 1));

      var args = getFireArgs().filter(arg => arg[0] === 'draw.selectionchange');
      t.equal(args.length, 0, 'should have zero selectionchange events');
      cleanUp(t.end);
    });
  });

  t.end();
});
