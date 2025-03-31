import './mock-browser';
import test from 'node:test';
import assert from 'node:assert/strict';

import * as commonSelectors from '../src/lib/common_selectors';
import type { MapMouseEvent } from '../src/types/types';

test('commonSelectors.isOfMetaType', () => {
  const isFoo = commonSelectors.isOfMetaType('foo');
  assert.equal(typeof isFoo, 'function');
  assert.ok(
    isFoo({
      featureTarget: {
        properties: {
          meta: 'foo'
        }
      }
    } as unknown as MapMouseEvent),
  );
  assert.equal(isFoo({} as unknown as MapMouseEvent), false);
  assert.equal(
    isFoo({
      featureTarget: {
        properties: {
          meta: 'bar'
        }
      }
    } as unknown as MapMouseEvent),
    false
  );
});

test('commonSelectors.isShiftMousedown', () => {
  assert.ok(
    commonSelectors.isShiftMousedown({
      originalEvent: {
        shiftKey: true,
        button: 0
      }
    } as unknown as MapMouseEvent)
  );

  assert.equal(
    commonSelectors.isShiftMousedown({
      originalEvent: {
        shiftKey: false,
        button: 0
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isShiftMousedown({
      originalEvent: {
        shiftKey: true,
        button: 1
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isShiftMousedown({
      nothing: false
    } as unknown as MapMouseEvent),
    false
  );
});

test('commonSelectors.isActiveFeature', () => {
  assert.ok(
    commonSelectors.isActiveFeature({
      featureTarget: {
        properties: {
          active: 'true',
          meta: 'feature'
        }
      }
    } as unknown as MapMouseEvent)
  );

  assert.equal(
    commonSelectors.isActiveFeature({
      foo: 'bar'
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isActiveFeature({
      featureTarget: {
        properties: {
          active: 'false',
          meta: 'feature'
        }
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isActiveFeature({
      featureTarget: {
        properties: {
          active: 'true',
          meta: 'something'
        }
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isActiveFeature({
      featureTarget: {
        properties: {
          active: true,
          meta: 'Feature'
        }
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isActiveFeature({
      nothing: false
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isActiveFeature({
      featureTarget: {}
    } as unknown as MapMouseEvent),
    false
  );
});

test('commonSelectors.isInactiveFeature', () => {
  assert.ok(
    commonSelectors.isInactiveFeature({
      featureTarget: {
        properties: {
          active: 'false',
          meta: 'feature'
        }
      }
    } as unknown as MapMouseEvent)
  );

  assert.equal(
    commonSelectors.isInactiveFeature({
      foo: 'bar'
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isInactiveFeature({
      featureTarget: {
        properties: {
          active: 'true',
          meta: 'feature'
        }
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isInactiveFeature({
      featureTarget: {
        properties: {
          active: 'false',
          meta: 'something'
        }
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isInactiveFeature({
      featureTarget: {
        properties: {
          active: false,
          meta: 'Feature'
        }
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isInactiveFeature({
      nothing: false
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isInactiveFeature({
      featureTarget: {}
    } as unknown as MapMouseEvent),
    false
  );
});

test('commonSelectors.noTarget', () => {
  assert.ok(
    commonSelectors.noTarget({
      something: 1
    } as unknown as MapMouseEvent)
  );

  assert.ok(
    commonSelectors.noTarget({
      FeatureTarget: 1
    } as unknown as MapMouseEvent)
  );

  assert.equal(
    commonSelectors.noTarget({
      featureTarget: {}
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.noTarget({
      featureTarget: null
    } as unknown as MapMouseEvent),
    false
  );
});

test('commonSelectors.isFeature', () => {
  assert.ok(
    commonSelectors.isFeature({
      featureTarget: {
        properties: {
          meta: 'feature'
        }
      }
    } as unknown as MapMouseEvent)
  );

  assert.equal(
    commonSelectors.isFeature({
      feee: 2
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isFeature({
      featureTarget: {
        properties: {
          meta: 'nonfeature'
        }
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isFeature({
      nothing: false
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isFeature({
      featureTarget: {}
    } as unknown as MapMouseEvent),
    false
  );
});

test('commonSelectors.isShiftDown', () => {
  assert.ok(
    commonSelectors.isShiftDown({
      originalEvent: {
        shiftKey: true
      }
    } as unknown as MapMouseEvent)
  );

  assert.equal(
    commonSelectors.isShiftDown({
      originalEvent: {
        shiftKey: false
      }
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isShiftDown({
      originalEvent: {}
    } as unknown as MapMouseEvent),
    false
  );

  assert.equal(
    commonSelectors.isShiftDown({
      nothing: true
    } as unknown as MapMouseEvent),
    false
  );
});

test('commonSelectors.isEscapeKey', () => {
  assert.ok(
    commonSelectors.isEscapeKey({
      keyCode: 27
    } as unknown as KeyboardEvent)
  );

  assert.equal(
    commonSelectors.isEscapeKey({
      keyCode: 13
    } as unknown as KeyboardEvent),
    false
  );

  assert.equal(
    commonSelectors.isEscapeKey({
      originalEvent: {}
    } as unknown as KeyboardEvent),
    false
  );
});

test('commonSelectors.isEnterKey', () => {
  assert.ok(
    commonSelectors.isEnterKey({
      keyCode: 13
    } as unknown as KeyboardEvent)
  );

  assert.equal(
    commonSelectors.isEnterKey({
      keyCode: 27
    } as unknown as KeyboardEvent),
    false
  );

  assert.equal(
    commonSelectors.isEnterKey({
      originalEvent: {}
    } as unknown as KeyboardEvent),
    false
  );
});

test('commonSelectors.true', () => {
  assert.ok(commonSelectors.isTrue());
});
