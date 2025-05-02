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

  assert.equal(commonSelectors.isEscapeKey({
    key: 'Escape'
  }), true);
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

  assert.equal(commonSelectors.isEnterKey({
    key: 'Enter'
  }), true);

  assert.equal(commonSelectors.isEnterKey({
    key: 'Escape'
  }), false);
});

test('commonSelectors.isBackspaceKey', () => {
  assert.ok(commonSelectors.isBackspaceKey({ keyCode: 8 }));
  assert.ok(commonSelectors.isBackspaceKey({ key: 'Backspace' }));

  assert.equal(commonSelectors.isBackspaceKey({ keyCode: 27 }), false);
  assert.equal(commonSelectors.isBackspaceKey({ key: 'Escape' }), false);
});

test('commonSelectors.isDeleteKey', () => {
  assert.ok(commonSelectors.isDeleteKey({ keyCode: 46 }));
  assert.ok(commonSelectors.isDeleteKey({ key: 'Delete' }));

  assert.equal(commonSelectors.isDeleteKey({ keyCode: 27 }), false);
  assert.equal(commonSelectors.isDeleteKey({ key: 'Escape' }), false);
});

test('commonSelectors.isDigit1Key', () => {
  assert.ok(commonSelectors.isDigit1Key({ keyCode: 49 }));
  assert.ok(commonSelectors.isDigit1Key({ key: '1' }));

  assert.equal(commonSelectors.isDigit1Key({ keyCode: 50 }), false);
  assert.equal(commonSelectors.isDigit1Key({ key: '2' }), false);
});

test('commonSelectors.isDigit2Key', () => {
  assert.ok(commonSelectors.isDigit2Key({ keyCode: 50 }));
  assert.ok(commonSelectors.isDigit2Key({ key: '2' }));

  assert.equal(commonSelectors.isDigit2Key({ keyCode: 51 }), false);
  assert.equal(commonSelectors.isDigit2Key({ key: '3' }), false);
});

test('commonSelectors.isDigit3Key', () => {
  assert.ok(commonSelectors.isDigit3Key({ keyCode: 51 }));
  assert.ok(commonSelectors.isDigit3Key({ key: '3' }));

  assert.equal(commonSelectors.isDigit3Key({ keyCode: 49 }), false);
  assert.equal(commonSelectors.isDigit3Key({ key: '1' }), false);
});

test('commonSelectors.isDigitKey', () => {
  const keyCode0 = 48;
  assert.ok(commonSelectors.isDigitKey({ keyCode: keyCode0 }));
  assert.ok(commonSelectors.isDigitKey({ key: '0' }));

  const keyCode2 = 50;
  assert.ok(commonSelectors.isDigitKey({ keyCode: keyCode2 }));
  assert.ok(commonSelectors.isDigitKey({ key: '2' }));

  const keyCode9 = 57;
  assert.ok(commonSelectors.isDigitKey({ keyCode: keyCode9 }));
  assert.ok(commonSelectors.isDigitKey({ key: '9' }));

  assert.equal(commonSelectors.isDigitKey({ keyCode: 47 }), false);
  assert.equal(commonSelectors.isDigitKey({ key: '/' }), false);

  assert.equal(commonSelectors.isDigitKey({ keyCode: 58 }), false);
  assert.equal(commonSelectors.isDigitKey({ key: ':' }), false);
});

test('commonSelectors.true', () => {
  assert.ok(commonSelectors.isTrue());
  assert.ok(commonSelectors.isTrue(false));
});
