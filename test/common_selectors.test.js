import test from 'tape';
import * as commonSelectors from '../src/lib/common_selectors';

test('commonSelectors.isOfMetaType', (t) => {
  const isFoo = commonSelectors.isOfMetaType('foo');
  t.equal(typeof isFoo, 'function');
  t.ok(isFoo({
    featureTarget: {
      properties: {
        meta: 'foo'
      }
    }
  }));
  t.notOk(isFoo({}));
  t.notOk(isFoo({
    featureTarget: {
      properties: {
        meta: 'bar'
      }
    }
  }));

  t.end();
});

test('commonSelectors.isShiftMousedown', (t) => {
  t.ok(commonSelectors.isShiftMousedown({
    originalEvent: {
      shiftKey: true,
      button: 0
    }
  }));

  t.notOk(commonSelectors.isShiftMousedown({
    originalEvent: {
      shiftKey: false,
      button: 0
    }
  }));

  t.notOk(commonSelectors.isShiftMousedown({
    originalEvent: {
      shiftKey: true,
      button: 1
    }
  }));

  t.notOk(commonSelectors.isShiftMousedown({
    nothing: false
  }));

  t.end();
});

test('commonSelectors.isActiveFeature', (t) => {
  t.ok(commonSelectors.isActiveFeature({
    featureTarget: {
      properties: {
        active: 'true',
        meta: 'feature'
      }
    }
  }));

  t.notOk(commonSelectors.isActiveFeature({
    foo: 'bar'
  }));

  t.notOk(commonSelectors.isActiveFeature({
    featureTarget: {
      properties: {
        active: 'false',
        meta: 'feature'
      }
    }
  }));

  t.notOk(commonSelectors.isActiveFeature({
    featureTarget: {
      properties: {
        active: 'true',
        meta: 'something'
      }
    }
  }));

  t.notOk(commonSelectors.isActiveFeature({
    featureTarget: {
      properties: {
        active: true,
        meta: 'Feature'
      }
    }
  }));

  t.notOk(commonSelectors.isActiveFeature({
    nothing: false
  }));

  t.notOk(commonSelectors.isActiveFeature({
    featureTarget: {}
  }));

  t.end();
});

test('commonSelectors.isInactiveFeature', (t) => {
  t.ok(commonSelectors.isInactiveFeature({
    featureTarget: {
      properties: {
        active: 'false',
        meta: 'feature'
      }
    }
  }));

  t.notOk(commonSelectors.isInactiveFeature({
    foo: 'bar'
  }));

  t.notOk(commonSelectors.isInactiveFeature({
    featureTarget: {
      properties: {
        active: 'true',
        meta: 'feature'
      }
    }
  }));

  t.notOk(commonSelectors.isInactiveFeature({
    featureTarget: {
      properties: {
        active: 'false',
        meta: 'something'
      }
    }
  }));

  t.notOk(commonSelectors.isInactiveFeature({
    featureTarget: {
      properties: {
        active: false,
        meta: 'Feature'
      }
    }
  }));

  t.notOk(commonSelectors.isInactiveFeature({
    nothing: false
  }));

  t.notOk(commonSelectors.isInactiveFeature({
    featureTarget: {}
  }));

  t.end();
});

test('commonSelectors.noTarget', (t) => {
  t.ok(commonSelectors.noTarget({
    something: 1
  }));

  t.ok(commonSelectors.noTarget({
    FeatureTarget: 1
  }));

  t.notOk(commonSelectors.noTarget({
    featureTarget: {}
  }));

  t.notOk(commonSelectors.noTarget({
    featureTarget: null
  }));

  t.end();
});

test('commonSelectors.isFeature', (t) => {
  t.ok(commonSelectors.isFeature({
    featureTarget: {
      properties: {
        meta: 'feature'
      }
    }
  }));

  t.notOk(commonSelectors.isFeature({
    feee: 2
  }));

  t.notOk(commonSelectors.isFeature({
    featureTarget: {
      properties: {
        meta: 'nonfeature'
      }
    }
  }));

  t.notOk(commonSelectors.isFeature({
    nothing: false
  }));

  t.notOk(commonSelectors.isFeature({
    featureTarget: {}
  }));

  t.end();
});

test('commonSelectors.isShiftDown', (t) => {
  t.ok(commonSelectors.isShiftDown({
    originalEvent: {
      shiftKey: true
    }
  }));

  t.notOk(commonSelectors.isShiftDown({
    originalEvent: {
      shiftKey: false
    }
  }));

  t.notOk(commonSelectors.isShiftDown({
    originalEvent: {}
  }));

  t.notOk(commonSelectors.isShiftDown({
    nothing: true
  }));

  t.end();
});

test('commonSelectors.isEscapeKey', (t) => {
  t.ok(commonSelectors.isEscapeKey({
    keyCode: 27
  }));

  t.notOk(commonSelectors.isEscapeKey({
    keyCode: 13
  }));

  t.notOk(commonSelectors.isEscapeKey({
    originalEvent: {}
  }));

  t.end();
});

test('commonSelectors.isEnterKey', (t) => {
  t.ok(commonSelectors.isEnterKey({
    keyCode: 13
  }));

  t.notOk(commonSelectors.isEnterKey({
    keyCode: 27
  }));

  t.notOk(commonSelectors.isEnterKey({
    originalEvent: {}
  }));

  t.end();
});

test('commonSelectors.true', (t) => {
  t.ok(commonSelectors.isTrue());
  t.ok(commonSelectors.isTrue(false));
  t.end();
});
