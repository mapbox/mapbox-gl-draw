import test from 'node:test';
import assert from 'node:assert/strict';

import * as commonSelectors from '../src/lib/common_selectors.js';

test('commonSelectors.isOfMetaType', () => {
  const isFoo = commonSelectors.isOfMetaType('foo');
  assert.equal(typeof isFoo, 'function');
  assert.ok(isFoo({
    featureTarget: {
      properties: {
        meta: 'foo'
      }
    }
  }));
  assert.equal(isFoo({}), false);
  assert.equal(isFoo({
    featureTarget: {
      properties: {
        meta: 'bar'
      }
    }
  }), false);
});

test('commonSelectors.isShiftMousedown', () => {
  assert.ok(commonSelectors.isShiftMousedown({
    originalEvent: {
      shiftKey: true,
      button: 0
    }
  }));

  assert.equal(commonSelectors.isShiftMousedown({
    originalEvent: {
      shiftKey: false,
      button: 0
    }
  }), false);

  assert.equal(commonSelectors.isShiftMousedown({
    originalEvent: {
      shiftKey: true,
      button: 1
    }
  }), false);

  assert.equal(commonSelectors.isShiftMousedown({
    nothing: false
  }), false);
});

test('commonSelectors.isActiveFeature', () => {
  assert.ok(commonSelectors.isActiveFeature({
    featureTarget: {
      properties: {
        active: 'true',
        meta: 'feature'
      }
    }
  }));

  assert.equal(commonSelectors.isActiveFeature({
    foo: 'bar'
  }), false);

  assert.equal(commonSelectors.isActiveFeature({
    featureTarget: {
      properties: {
        active: 'false',
        meta: 'feature'
      }
    }
  }), false);

  assert.equal(commonSelectors.isActiveFeature({
    featureTarget: {
      properties: {
        active: 'true',
        meta: 'something'
      }
    }
  }), false);

  assert.equal(commonSelectors.isActiveFeature({
    featureTarget: {
      properties: {
        active: true,
        meta: 'Feature'
      }
    }
  }), false);

  assert.equal(commonSelectors.isActiveFeature({
    nothing: false
  }), false);

  assert.equal(commonSelectors.isActiveFeature({
    featureTarget: {}
  }), false);
});

test('commonSelectors.isInactiveFeature', () => {
  assert.ok(commonSelectors.isInactiveFeature({
    featureTarget: {
      properties: {
        active: 'false',
        meta: 'feature'
      }
    }
  }));

  assert.equal(commonSelectors.isInactiveFeature({
    foo: 'bar'
  }), false);

  assert.equal(commonSelectors.isInactiveFeature({
    featureTarget: {
      properties: {
        active: 'true',
        meta: 'feature'
      }
    }
  }), false);

  assert.equal(commonSelectors.isInactiveFeature({
    featureTarget: {
      properties: {
        active: 'false',
        meta: 'something'
      }
    }
  }), false);

  assert.equal(commonSelectors.isInactiveFeature({
    featureTarget: {
      properties: {
        active: false,
        meta: 'Feature'
      }
    }
  }), false);

  assert.equal(commonSelectors.isInactiveFeature({
    nothing: false
  }), false);

  assert.equal(commonSelectors.isInactiveFeature({
    featureTarget: {}
  }), false);
});

test('commonSelectors.noTarget', () => {
  assert.ok(commonSelectors.noTarget({
    something: 1
  }));

  assert.ok(commonSelectors.noTarget({
    FeatureTarget: 1
  }));

  assert.equal(commonSelectors.noTarget({
    featureTarget: {}
  }), false);

  assert.equal(commonSelectors.noTarget({
    featureTarget: null
  }), false);
});

test('commonSelectors.isFeature', () => {
  assert.ok(commonSelectors.isFeature({
    featureTarget: {
      properties: {
        meta: 'feature'
      }
    }
  }));

  assert.equal(commonSelectors.isFeature({
    feee: 2
  }), false);

  assert.equal(commonSelectors.isFeature({
    featureTarget: {
      properties: {
        meta: 'nonfeature'
      }
    }
  }), false);

  assert.equal(commonSelectors.isFeature({
    nothing: false
  }), false);

  assert.equal(commonSelectors.isFeature({
    featureTarget: {}
  }), false);
});

test('commonSelectors.isShiftDown', () => {
  assert.ok(commonSelectors.isShiftDown({
    originalEvent: {
      shiftKey: true
    }
  }));

  assert.equal(commonSelectors.isShiftDown({
    originalEvent: {
      shiftKey: false
    }
  }), false);

  assert.equal(commonSelectors.isShiftDown({
    originalEvent: {}
  }), false);

  assert.equal(commonSelectors.isShiftDown({
    nothing: true
  }), false);
});

test('commonSelectors.isEscapeKey', () => {
  assert.ok(commonSelectors.isEscapeKey({
    keyCode: 27
  }));

  assert.equal(commonSelectors.isEscapeKey({
    keyCode: 13
  }), false);

  assert.equal(commonSelectors.isEscapeKey({
    originalEvent: {}
  }), false);
});

test('commonSelectors.isEnterKey', () => {
  assert.ok(commonSelectors.isEnterKey({
    keyCode: 13
  }));

  assert.equal(commonSelectors.isEnterKey({
    keyCode: 27
  }), false);

  assert.equal(commonSelectors.isEnterKey({
    originalEvent: {}
  }), false);
});

test('commonSelectors.true', () => {
  assert.ok(commonSelectors.isTrue());
  assert.ok(commonSelectors.isTrue(false));
});
