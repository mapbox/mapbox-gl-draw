/* eslint no-shadow:[0] */
import {
  DOM,
  createButton,
  translate,
  translatePoint
} from '../src/lib/util';
import test from 'tape';

test('util', t => {

  t.test('DOM', t => {
    t.ok(DOM.mousePos instanceof Function, 'DOM.mousePos is a function');
    t.ok(DOM.create instanceof Function, 'DOM.create is a function');
    t.ok(DOM.removeClass instanceof Function, 'DOM.removeClass is a function');
    t.ok(DOM.setTransform instanceof Function, 'DOM.setTransform is a function');
    t.ok(DOM.disableSelection instanceof Function, 'DOM.disableSelection is a function');
    t.ok(DOM.enableSelection instanceof Function, 'DOM.enableSelection is a function');
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
    t.end();
  });

  t.end();
});
