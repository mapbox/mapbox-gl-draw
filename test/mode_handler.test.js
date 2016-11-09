import test from 'tape';
import xtend from 'xtend';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import modeHandler from '../src/lib/mode_handler';
import createMockModeHandlerContext from './utils/create_mock_mode_handler_context';
import createMockMode from './utils/create_mock_mode';

test('returned API', t => {
  const mh = modeHandler(createMockMode(), createMockModeHandlerContext());
  t.equal(typeof mh.render, 'function', 'exposes render');
  t.equal(typeof mh.stop, 'function', 'exposes stop');
  t.equal(typeof mh.trash, 'function', 'exposes trash');
  t.equal(typeof mh.drag, 'function', 'exposes drag');
  t.equal(typeof mh.click, 'function', 'exposes click');
  t.equal(typeof mh.mousemove, 'function', 'exposes mousemove');
  t.equal(typeof mh.mousedown, 'function', 'exposes mousedown');
  t.equal(typeof mh.mouseup, 'function', 'exposes mouseup');
  t.equal(typeof mh.mouseout, 'function', 'exposes mouseout');
  t.equal(typeof mh.keydown, 'function', 'exposes keydown');
  t.equal(typeof mh.keyup, 'function', 'exposes keyup');
  t.equal(typeof mh.combineFeatures, 'function', 'exposes combineFeatures');
  t.equal(typeof mh.uncombineFeatures, 'function', 'exposes uncombineFeatures');
  t.equal(Object.keys(mh).length, 13, 'no unexpected properties');
  t.end();
});

test('ModeHandler calling mode.start with context, and delegation functionality', t => {
  let startContext;
  function handleStart() {
    startContext = this;
  }
  const handleStartSpy = spy(handleStart);
  const mode = xtend(createMockMode(), {
    start: handleStartSpy
  });
  const drawContext = createMockModeHandlerContext();

  const mh = modeHandler(mode, drawContext);
  t.equal(handleStartSpy.callCount, 1, 'start was called on mode handler creation');
  t.equal(typeof startContext.on, 'function', 'start context has on()');
  t.equal(typeof startContext.render, 'function', 'start context has render()');
  t.equal(Object.keys(startContext).length, 2, 'start context has no unexpected properties');

  startContext.render('foo');
  t.ok(drawContext.store.featureChanged.calledWith('foo'), 'start context render calls store.featureChanged');

  t.throws(() => {
    startContext.on('bar', () => true, () => {});
  }, 'start context on throws on unknown event type');

  mh.mousedown({ one: 1 });
  t.equal(drawContext.store.render.callCount, 0, 'render not called if no handler fires');
  t.equal(drawContext.ui.updateMapClasses.callCount, 0, 'updateMapClasses not called if no handler fires');

  const mousedownSpy = spy();
  startContext.on('mousedown', () => true, mousedownSpy);
  mh.mousedown({ two: 2 });
  t.equal(mousedownSpy.callCount, 1, 'mousedown callback called via delegation');
  t.deepEqual(mousedownSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');
  t.equal(drawContext.store.render.callCount, 1, 'render called if handler fires');
  t.equal(drawContext.ui.updateMapClasses.callCount, 1, 'updateMapClasses called if handler fires');

  const mousedownFailSpy = spy();
  mousedownSpy.reset();
  startContext.on('mousedown', e => !e.three, mousedownFailSpy);
  mh.mousedown({ three: 3 });
  t.equal(mousedownFailSpy.callCount, 0, 'delegation only calls callbacks with selectors returning true');
  t.equal(mousedownSpy.callCount, 1);
  t.deepEqual(mousedownSpy.getCall(0).args, [{ three: 3 }]);

  const dragSpy = spy();
  startContext.on('drag', () => true, dragSpy);
  mh.drag({ two: 2 });
  t.equal(dragSpy.callCount, 1, 'drag callback called via delegation');
  t.deepEqual(dragSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const clickSpy = spy();
  startContext.on('click', () => true, clickSpy);
  mh.click({ two: 2 });
  t.equal(clickSpy.callCount, 1, 'click callback called via delegation');
  t.deepEqual(clickSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const mousemoveSpy = spy();
  startContext.on('mousemove', () => true, mousemoveSpy);
  mh.mousemove({ two: 2 });
  t.equal(mousemoveSpy.callCount, 1, 'mousemove callback called via delegation');
  t.deepEqual(mousemoveSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const mouseupSpy = spy();
  startContext.on('mouseup', () => true, mouseupSpy);
  mh.mouseup({ two: 2 });
  t.equal(mouseupSpy.callCount, 1, 'mouseup callback called via delegation');
  t.deepEqual(mouseupSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const mouseoutSpy = spy();
  startContext.on('mouseout', () => true, mouseoutSpy);
  mh.mouseout({ two: 2 });
  t.equal(mouseoutSpy.callCount, 1, 'mouseout callback called via delegation');
  t.deepEqual(mouseoutSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const keydownSpy = spy();
  startContext.on('keydown', () => true, keydownSpy);
  mh.keydown({ two: 2 });
  t.equal(keydownSpy.callCount, 1, 'keydown callback called via delegation');
  t.deepEqual(keydownSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  const keyupSpy = spy();
  startContext.on('keyup', () => true, keyupSpy);
  mh.keyup({ two: 2 });
  t.equal(keyupSpy.callCount, 1, 'keyup callback called via delegation');
  t.deepEqual(keyupSpy.getCall(0).args, [{ two: 2 }], 'with correct argument');

  t.end();
});

test('ModeHandler#stop calling mode.stop', t => {
  const mode = createMockMode();
  const mh = modeHandler(mode, createMockModeHandlerContext());

  mh.stop();
  t.equal(mode.stop.callCount, 1, 'mode.stop called');

  t.end();
});

test('ModeHandler#stop not calling nonexistent mode.stop', t => {
  const mode = createMockMode();
  delete mode.stop;
  const mh = modeHandler(mode, createMockModeHandlerContext());

  t.doesNotThrow(() => {
    mh.stop();
  });

  t.end();
});

test('Modehandler#trash', t => {
  const mode = createMockMode();
  const drawContext = createMockModeHandlerContext();
  const mh = modeHandler(mode, drawContext);

  mh.trash();
  t.equal(mode.trash.callCount, 1, 'mode.trash called');
  t.equal(drawContext.store.render.callCount, 1, 'store.render called');

  t.end();
});

test('Modehandler#trash without a mode.trash', t => {
  const mode = createMockMode();
  delete mode.trash;
  const drawContext = createMockModeHandlerContext();
  const mh = modeHandler(mode, drawContext);

  t.doesNotThrow(() => {
    mh.trash();
  });
  t.equal(drawContext.store.render.callCount, 0, 'store.render not called');

  t.end();
});
