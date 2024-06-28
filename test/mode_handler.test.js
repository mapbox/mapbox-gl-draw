import test from 'node:test';
import assert from 'node:assert/strict';
import {spy} from 'sinon';
import modeHandler from '../src/lib/mode_handler.js';
import createMockModeHandlerContext from './utils/create_mock_mode_handler_context.js';
import createMockMode from './utils/create_mock_mode.js';

test('returned API', () => {
  const mh = modeHandler(createMockMode(), createMockModeHandlerContext());
  assert.equal(typeof mh.render, 'function', 'exposes render');
  assert.equal(typeof mh.stop, 'function', 'exposes stop');
  assert.equal(typeof mh.trash, 'function', 'exposes trash');
  assert.equal(typeof mh.drag, 'function', 'exposes drag');
  assert.equal(typeof mh.click, 'function', 'exposes click');
  assert.equal(typeof mh.mousemove, 'function', 'exposes mousemove');
  assert.equal(typeof mh.mousedown, 'function', 'exposes mousedown');
  assert.equal(typeof mh.mouseup, 'function', 'exposes mouseup');
  assert.equal(typeof mh.mouseout, 'function', 'exposes mouseout');
  assert.equal(typeof mh.keydown, 'function', 'exposes keydown');
  assert.equal(typeof mh.keyup, 'function', 'exposes keyup');
  assert.equal(typeof mh.touchstart, 'function', 'exposes touchstart');
  assert.equal(typeof mh.touchmove, 'function', 'exposes touchmove');
  assert.equal(typeof mh.touchend, 'function', 'exposes touchend');
  assert.equal(typeof mh.tap, 'function', 'exposes tap');
  assert.equal(typeof mh.combineFeatures, 'function', 'exposes combineFeatures');
  assert.equal(typeof mh.uncombineFeatures, 'function', 'exposes uncombineFeatures');
  assert.equal(Object.keys(mh).length, 17, 'no unexpected properties');

});

test('ModeHandler calling mode.start with context, and delegation functionality', () => {
  let startContext;
  function handleStart() {
    // eslint-disable-next-line
    startContext = this;
  }
  const handleStartSpy = spy(handleStart);
  const mode = Object.assign(createMockMode(), {
    start: handleStartSpy
  });
  const drawContext = createMockModeHandlerContext();

  const mh = modeHandler(mode, drawContext);
  assert.equal(handleStartSpy.callCount, 1, 'start was called on mode handler creation');
  assert.equal(typeof startContext.on, 'function', 'start context has on()');
  assert.equal(typeof startContext.render, 'function', 'start context has render()');
  assert.equal(Object.keys(startContext).length, 2, 'start context has no unexpected properties');

  startContext.render('foo');
  assert.ok(drawContext.store.featureChanged.calledWith('foo'), 'start context render calls store.featureChanged');

  assert.throws(() => {
    startContext.on('bar', () => true, () => {});
  }, 'start context on throws on unknown event type');

  mh.mousedown({ one: 1 });
  assert.equal(drawContext.store.render.callCount, 0, 'render not called if no handler fires');
  assert.equal(drawContext.ui.updateMapClasses.callCount, 0, 'updateMapClasses not called if no handler fires');

  const mousedownSpy = spy();
  startContext.on('mousedown', () => true, mousedownSpy);
  mh.mousedown({ two: 2 });
  assert.equal(mousedownSpy.callCount, 1, 'mousedown callback called via delegation');
  assert.deepEqual(mousedownSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');
  assert.equal(drawContext.store.render.callCount, 1, 'render called if handler fires');
  assert.equal(drawContext.ui.updateMapClasses.callCount, 1, 'updateMapClasses called if handler fires');

  const mousedownFailSpy = spy();
  mousedownSpy.resetHistory();
  startContext.on('mousedown', e => !e.three, mousedownFailSpy);
  mh.mousedown({ three: 3 });
  assert.equal(mousedownFailSpy.callCount, 0, 'delegation only calls callbacks with selectors returning true');
  assert.equal(mousedownSpy.callCount, 1);
  assert.deepEqual(mousedownSpy.getCall(0).args, [{ three: 3 }]);

  const dragSpy = spy();
  startContext.on('drag', () => true, dragSpy);
  mh.drag({ two: 2 });
  assert.equal(dragSpy.callCount, 1, 'drag callback called via delegation');
  assert.deepEqual(dragSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const clickSpy = spy();
  startContext.on('click', () => true, clickSpy);
  mh.click({ two: 2 });
  assert.equal(clickSpy.callCount, 1, 'click callback called via delegation');
  assert.deepEqual(clickSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const mousemoveSpy = spy();
  startContext.on('mousemove', () => true, mousemoveSpy);
  mh.mousemove({ two: 2 });
  assert.equal(mousemoveSpy.callCount, 1, 'mousemove callback called via delegation');
  assert.deepEqual(mousemoveSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const mouseupSpy = spy();
  startContext.on('mouseup', () => true, mouseupSpy);
  mh.mouseup({ two: 2 });
  assert.equal(mouseupSpy.callCount, 1, 'mouseup callback called via delegation');
  assert.deepEqual(mouseupSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const mouseoutSpy = spy();
  startContext.on('mouseout', () => true, mouseoutSpy);
  mh.mouseout({ two: 2 });
  assert.equal(mouseoutSpy.callCount, 1, 'mouseout callback called via delegation');
  assert.deepEqual(mouseoutSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const keydownSpy = spy();
  startContext.on('keydown', () => true, keydownSpy);
  mh.keydown({ two: 2 });
  assert.equal(keydownSpy.callCount, 1, 'keydown callback called via delegation');
  assert.deepEqual(keydownSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const keyupSpy = spy();
  startContext.on('keyup', () => true, keyupSpy);
  mh.keyup({ two: 2 });
  assert.equal(keyupSpy.callCount, 1, 'keyup callback called via delegation');
  assert.deepEqual(keyupSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const touchstartSpy = spy();
  startContext.on('touchstart', () => true, touchstartSpy);
  mh.touchstart({ two: 2 });
  assert.equal(touchstartSpy.callCount, 1, 'touchstart callback called via delegation');
  assert.deepEqual(touchstartSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const touchmoveSpy = spy();
  startContext.on('touchmove', () => true, touchmoveSpy);
  mh.touchmove({ two: 2 });
  assert.equal(touchmoveSpy.callCount, 1, 'touchmove callback called via delegation');
  assert.deepEqual(touchmoveSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const touchendSpy = spy();
  startContext.on('touchend', () => true, touchendSpy);
  mh.touchend({ two: 2 });
  assert.equal(touchendSpy.callCount, 1, 'touchend callback called via delegation');
  assert.deepEqual(touchendSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');


});

test('ModeHandler#stop calling mode.stop', () => {
  const mode = createMockMode();
  const mh = modeHandler(mode, createMockModeHandlerContext());

  mh.stop();
  assert.equal(mode.stop.callCount, 1, 'mode.stop called');


});

test('ModeHandler#stop not calling nonexistent mode.stop', () => {
  const mode = createMockMode();
  delete mode.stop;
  const mh = modeHandler(mode, createMockModeHandlerContext());

  assert.doesNotThrow(() => {
    mh.stop();
  });


});

test('Modehandler#trash', () => {
  const mode = createMockMode();
  const drawContext = createMockModeHandlerContext();
  const mh = modeHandler(mode, drawContext);

  mh.trash();
  assert.equal(mode.trash.callCount, 1, 'mode.trash called');
  assert.equal(drawContext.store.render.callCount, 1, 'store.render called');


});

test('Modehandler#trash without a mode.trash', () => {
  const mode = createMockMode();
  delete mode.trash;
  const drawContext = createMockModeHandlerContext();
  const mh = modeHandler(mode, drawContext);

  assert.doesNotThrow(() => {
    mh.trash();
  });
  assert.equal(drawContext.store.render.callCount, 0, 'store.render not called');


});
