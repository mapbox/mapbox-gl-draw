import test from 'tape';
import domUtils from '../src/lib/dom_utils';

test('domUtils', t => {
  t.equal(typeof domUtils.create, 'function', 'domUtils.create exposed');
  t.equal(typeof domUtils.removeClass, 'function', 'domUtils.removeClass exposed');
  t.equal(Object.keys(domUtils).length, 2, 'no unexpected properties');
  t.end();
});
