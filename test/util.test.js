/* eslint no-shadow:[0] */
import mapboxgl from 'mapbox-gl';
import {
  DOM,
  createButton,
  translate,
  translatePoint
} from '../src/util';
import {
  features,
  createMap,
  accessToken,
  closeEnough
} from './utils';
import test from 'tape';

mapboxgl.accessToken = accessToken;

const { point } = features;

var map = createMap();

map.on('load', () => {

  test('util', t => {

    t.test('DOM', t => {
      t.ok(DOM.mousePos instanceof Function, 'DOM.mousePos is a function');
      t.ok(DOM.create instanceof Function, 'DOM.create is a function');
      t.ok(DOM.removeClass instanceof Function, 'DOM.removeClass is a function');
      t.ok(DOM.setTransform instanceof Function, 'DOM.setTransform is a function');
      t.ok(DOM.disableSelection instanceof Function, 'DOM.disableSelection is a function');
      t.ok(DOM.enableSelection instanceof Function, 'DOM.enableSelection is a function');

      DOM.create('div', 'test', map.getContainer(), { id: 'test-div' });
      let div = window.document.getElementById('test-div');
      t.ok(div, 'DOM.create creates a div');
      t.equal(div.className, 'test', 'DOM.create adds the correct class');

      console.log(div.classList);
      DOM.removeClass(div, 'test');
      t.equal(div.className, '', 'DOM.removeClass removes class');
      console.log(div.classList);
      console.log(div.className);

      t.end();
    });

    t.test('createButton', t => {
      t.ok(createButton instanceof Function, 'createButton is a function');
      t.end();
    });

    t.test('translate', t => {
      t.ok(translate instanceof Function, 'translate is a function');
      t.end();
    });

    t.test('translatePoint', t => {
      t.ok(translatePoint instanceof Function, 'translatePoint is a function');
      let expected = [2, 2];
      let expectedPx = map.project(expected);
      let pointPx = map.project(point.geometry.coordinates);
      let dx = expectedPx.x - pointPx.x;
      let dy = expectedPx.y - pointPx.y;
      var newPoint = translatePoint(point.geometry.coordinates, dx, dy, map);

      t.ok(closeEnough(newPoint[0], expected[0]), 'x coordinate after point translation is close enough');
      t.ok(closeEnough(newPoint[1], expected[1]), 'y coordinate after point translation is close enough');

      t.end();
    });

    t.end();
  });

});
