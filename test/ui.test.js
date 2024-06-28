import test from 'node:test';
import assert from 'node:assert/strict';
import {spy} from 'sinon';

import ui from '../src/ui.js';

function createMockContext({ position, controls } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const controlContainer = document.createElement('div');
  controlContainer.className = `mapboxgl-ctrl-${position || 'top-left'}`;
  container.appendChild(controlContainer);

  return {
    context: {
      container,
      options: {
        controls,
        keybindings: true
      },
      api: {
        trash: spy()
      },
      events: {
        changeMode: spy()
      }
    },
    cleanup() {
      document.body.removeChild(container);
    },
    getControlContainer() {
      return controlContainer;
    }
  };
}

function getButtons(div) {
  return Array.prototype.slice.call(div.getElementsByClassName('mapbox-gl-draw_ctrl-draw-btn'));
}

test('ui container classes', async (t) => {
  const { context, cleanup } = createMockContext();
  const testUi = ui(context);

  assert.equal(context.container.className, '', 'confirm that class starts empty');

  // Each sub-test relies on state from the prior sub-tests

  t.test('update all classes', () => {
    testUi.queueMapClasses({
      mode: 'direct_select',
      feature: 'vertex',
      mouse: 'move'
    });
    testUi.updateMapClasses();
    assert.ok(context.container.classList.contains('mode-direct_select'), 'mode class set');
    assert.ok(context.container.classList.contains('feature-vertex'), 'feature class set');
    assert.ok(context.container.classList.contains('mouse-move'), 'mouse class set');
  });

  await t.test('update only feature class', () => {
    testUi.queueMapClasses({
      feature: 'midpoint'
    });
    testUi.updateMapClasses();
    assert.ok(context.container.classList.contains('mode-direct_select'), 'mode class remains');
    assert.ok(context.container.classList.contains('feature-midpoint'), 'feature class updated');
    assert.ok(context.container.classList.contains('mouse-move'), 'mouse class remains');
  });

  await t.test('update mode and mouse classes', () => {
    testUi.queueMapClasses({
      mode: 'foo',
      mouse: 'bar'
    });
    testUi.updateMapClasses();
    assert.ok(context.container.classList.contains('mode-foo'), 'mode class updated');
    assert.ok(context.container.classList.contains('feature-midpoint'), 'feature class remains');
    assert.ok(context.container.classList.contains('mouse-bar'), 'mouse class updated');
  });

  await t.test('remove only feature class', () => {
    testUi.queueMapClasses({
      feature: null
    });
    testUi.updateMapClasses();
    assert.ok(context.container.classList.contains('mode-foo'), 'mode class remains');
    assert.ok(context.container.className.indexOf('feature-') === -1, 'feature class removed');
    assert.ok(context.container.classList.contains('mouse-bar'), 'mouse class remains');
  });

  await t.test('remove all classes', () => {
    testUi.queueMapClasses({
      feature: null,
      mode: null,
      mouse: null
    });
    testUi.updateMapClasses();
    assert.ok(context.container.className.indexOf('mode-') === -1, 'mode class removed');
    assert.ok(context.container.className.indexOf('feature-') === -1, 'feature class still gone');
    assert.ok(context.container.className.indexOf('mouse-') === -1, 'mouse class removed');
  });

  cleanup();
});

test('ui buttons with no options.controls', () => {
  const { context, cleanup } = createMockContext();
  const testUi = ui(context);

  const div = testUi.addButtons();
  assert.deepEqual(getButtons(div), [], 'still no buttons');

  cleanup();
});

test('ui buttons with one options.controls', () => {
  /* eslint-disable */
  const { context, cleanup } = createMockContext({
    controls: {
      line_string: true
    }
  });
  /* eslint-enable */
  const testUi = ui(context);

  const div = testUi.addButtons();
  const buttons = getButtons(div);
  assert.equal(buttons.length, 1, 'one button added');
  assert.ok(buttons[0].classList.contains('mapbox-gl-draw_line'), 'has line class');
  assert.ok(buttons[0].classList.contains('mapbox-gl-draw_ctrl-draw-btn'), 'has control class');

  cleanup();
});

test('ui buttons control group container inserted above attribution control, in control container, by addButtons', () => {
  const { context, cleanup, getControlContainer } = createMockContext({
    controls: {
      trash: true
    }
  });

  const controlContainer = getControlContainer();
  const testUi = ui(context);

  assert.equal(controlContainer.getElementsByClassName('mapboxgl-ctrl-group').length, 0,
    'confirm control group does not exist at first');

  const controlGroup = testUi.addButtons();
  assert.ok(controlGroup, 'control group exists');

  cleanup();
});

test('ui buttons with all options.controls, no attribution control', async (t) => {
  /* eslint-disable */
  const { context, cleanup } = createMockContext({
    controls: {
      line_string: true,
      point: true,
      polygon: true,
      trash: true
    }
  });
  /* eslint-enable */
  const testUi = ui(context);

  const controlGroup = testUi.addButtons();
  const buttons = getButtons(controlGroup);

  assert.equal(buttons.length, 4, 'one button added');

  assert.ok(buttons[0].classList.contains('mapbox-gl-draw_line'), 'first button has line class');
  assert.ok(buttons[0].classList.contains('mapbox-gl-draw_ctrl-draw-btn'), 'first button has control class');
  assert.equal(buttons[0].parentNode, controlGroup, 'first button is in controlGroup');
  const lineButton = buttons[0];

  assert.ok(buttons[1].classList.contains('mapbox-gl-draw_polygon'), 'second button has polygon class');
  assert.ok(buttons[1].classList.contains('mapbox-gl-draw_ctrl-draw-btn'), 'second button has control class');
  assert.equal(buttons[1].parentNode, controlGroup, 'second button is in controlGroup');
  const polygonButton = buttons[1];
  assert.ok(buttons[2].classList.contains('mapbox-gl-draw_point'), 'third button has point class');
  assert.ok(buttons[2].classList.contains('mapbox-gl-draw_ctrl-draw-btn'), 'third button has control class');
  assert.equal(buttons[2].parentNode, controlGroup, 'third button is in controlGroup');
  const pointButton = buttons[2];
  assert.ok(buttons[3].classList.contains('mapbox-gl-draw_trash'), 'fourth button has trash class');
  assert.ok(buttons[3].classList.contains('mapbox-gl-draw_ctrl-draw-btn'), 'fourth button has control class');
  assert.equal(buttons[3].parentNode, controlGroup, 'fourth button is in controlGroup');
  const trashButton = buttons[3];

  t.test('click line button', () => {
    lineButton.click();

    assert.ok(lineButton.classList.contains('active'), 'line button is active');
    assert.equal(polygonButton.classList.contains('active'), false, 'polygon button is inactive');
    assert.equal(pointButton.classList.contains('active'), false, 'point button is inactive');
    assert.equal(trashButton.classList.contains('active'), false, 'trash button is inactive');

    assert.equal(context.events.changeMode.callCount, 1, 'changeMode called');
    assert.deepEqual(context.events.changeMode.getCall(0).args, ['draw_line_string'], 'with correct arguments');
    context.events.changeMode.resetHistory();
  });

  await t.test('click polygon button', () => {
    polygonButton.click();

    assert.equal(lineButton.classList.contains('active'), false, 'line button is inactive');
    assert.ok(polygonButton.classList.contains('active'), 'polygon button is active');
    assert.equal(pointButton.classList.contains('active'), false, 'point button is inactive');
    assert.equal(trashButton.classList.contains('active'), false, 'trash button is inactive');

    assert.equal(context.events.changeMode.callCount, 1, 'changeMode called');
    assert.deepEqual(context.events.changeMode.getCall(0).args, ['draw_polygon'], 'with correct arguments');
    context.events.changeMode.resetHistory();
  });

  await t.test('programmatically activate point button, then programmatically deactivate', () => {
    testUi.setActiveButton('point');

    assert.equal(lineButton.classList.contains('active'), false, 'line button is inactive');
    assert.equal(polygonButton.classList.contains('active'), false, 'polygon button is inactive');
    assert.ok(pointButton.classList.contains('active'), 'point button is active');
    assert.equal(trashButton.classList.contains('active'), false, 'trash button is inactive');
    assert.equal(context.events.changeMode.callCount, 0, 'changeMode not called');

    testUi.setActiveButton();

    assert.equal(lineButton.classList.contains('active'), false, 'line button is inactive');
    assert.equal(polygonButton.classList.contains('active'), false, 'polygon button is inactive');
    assert.equal(pointButton.classList.contains('active'), false, 'point button is inactive');
    assert.equal(trashButton.classList.contains('active'), false, 'trash button is inactive');
    assert.equal(context.events.changeMode.callCount, 0, 'changeMode not called');
  });

  await t.test('click trash button', () => {
    trashButton.click();

    assert.equal(lineButton.classList.contains('active'), false, 'line button is inactive');
    assert.equal(polygonButton.classList.contains('active'), false, 'polygon button is inactive');
    assert.equal(pointButton.classList.contains('active'), false, 'point button is inactive');
    assert.equal(trashButton.classList.contains('active'), false, 'trash button is inactive');

    assert.equal(context.events.changeMode.callCount, 0, 'changeMode not called');
  });

  cleanup();
});
