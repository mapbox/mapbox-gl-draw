/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl';
import GLDraw from '../';
import { accessToken, createMap } from './utils';

mapboxgl.accessToken = accessToken;


const CLASS_NAME = 'mapboxgl-ctrl-draw-btn';

var map = createMap();

map.on('load', () => {

  test('DOM element test', t => {

    t.skip('Initiate without controls', t => {
      var Draw = GLDraw({ drawing: false });
      map.addControl(Draw);
      t.false(isInDOM('square') || isInDOM('shape') || isInDOM('line') || isInDOM('marker') || isInDOM('trash'),
          'no buttons added when drawing is false');
      Draw.remove();
      t.end();
    });

    t.skip('Initiate with controls', t => {
      var Draw = GLDraw();
      map.addControl(Draw);
      t.ok(isInDOM('square') && isInDOM('shape') && isInDOM('line') && isInDOM('marker'),
          'square, shape, line, marker buttons added when draw is added');
      t.false(trashIsVisible(), 'trash button is invisible when draw is added');
      Draw.remove();
      t.end();
    });

    t.skip('initialize with only square control', t => {
      var Draw = GLDraw({
        controls: {
          square: true,
          shape: false,
          line: false,
          marker: false
        }
      });
      map.addControl(Draw);
      t.ok(trashIsAdded(), 'trash button is added');
      t.ok(isInDOM('square'), 'square button is added');
      t.false(isInDOM('shape'), 'shape button is added');
      t.false(isInDOM('line'), 'line button is added');
      t.false(isInDOM('marker'), 'marker button is added');
      Draw.remove();
      t.end();
    });

    t.end();
  });

});

function isInDOM(button) {
  return window.document.getElementsByClassName(`${CLASS_NAME} ${button}`).length === 1;
}

function trashIsVisible() {
  return window.document.getElementsByClassName(`${CLASS_NAME} trash`)[0].style.display !== 'none';
}

function trashIsAdded() {
  return window.document.getElementsByClassName(`${CLASS_NAME} trash`).length === 1;
}
