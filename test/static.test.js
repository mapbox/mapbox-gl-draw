/* eslint no-shadow:[0] */
import test from 'node:test';
import assert from 'node:assert/strict';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import {spy} from 'sinon';

import MapboxDraw from '../index.js';
import {setupAfterNextRender} from './utils/after_next_render.js';
import makeMouseEvent from './utils/make_mouse_event.js';
import getGeoJSON from './utils/get_geojson.js';
import createMap from './utils/create_map.js';

test('static', async (t) => {
  const map = createMap();
  const opts = {
    modes: {
      static: StaticMode
    },
    defaultMode: 'static'
  };
  const Draw = new MapboxDraw(opts);
  map.addControl(Draw);

  spy(map, 'fire');
  map.dragPan.disable();
  spy(map.dragPan, 'disable');

  const afterNextRender = setupAfterNextRender(map);

  const cleanUp = function() {
    Draw.deleteAll();
    map.fire.resetHistory();
  };

  const getFireArgs = function() {
    const args = [];
    for (let i = 0; i < map.fire.callCount; i++) {
      args.push(map.fire.getCall(i).args);
    }
    return args;
  };

  t.test('static - init map for tests', () => {
    const done = function() {
      map.off('load', done);
    };

    if (map.loaded()) {
      done();
    } else {
      map.on('load', done);
    }
  });

  await t.test('static - box select', async () => {
    Draw.add(getGeoJSON('negativePoint'));
    Draw.add(getGeoJSON('point'));
    map.fire.resetHistory();

    await afterNextRender();
    map.dragPan.disable.resetHistory();
    map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
    assert.equal(map.dragPan.disable.callCount, 0, 'dragPan is still enabled');
    map.fire('mousemove', makeMouseEvent(15, 15, { shiftKey: true }));
    map.fire('mouseup', makeMouseEvent(15, 15, { shiftKey: true }));

    const args = getFireArgs().filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 0, 'should have zero selectionchange events');
    cleanUp();
  });

  await t.test('static - try clicking many features', async () => {
    const features = [getGeoJSON('point'), getGeoJSON('line'), getGeoJSON('square')];
    Draw.add({
      type: 'FeatureCollection',
      features
    });
    map.fire.resetHistory();

    await afterNextRender();
    map.fire('mousedown', makeMouseEvent(10, 10));
    map.fire('mouseup', makeMouseEvent(10, 10));
    map.fire('mousemove', makeMouseEvent(1.5, 1.5));
    map.fire('mouseup', makeMouseEvent(1.5, 1.5));
    map.fire('mousemove', makeMouseEvent(1, 1));
    map.fire('mouseup', makeMouseEvent(1, 1));

    const args = getFireArgs().filter(arg => arg[0] === 'draw.selectionchange');
    assert.equal(args.length, 0, 'should have zero selectionchange events');
    cleanUp();
  });
});
