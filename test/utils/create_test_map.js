import xtend from 'xtend';
import createMap from './create_map';
import createSyntheticEvent from 'synthetic-dom-events';
import createAfterNextRender from './after_next_render';
import makeMouseEvent from './make_mouse_event';
import click from './mouse_click';
import GLDraw from '../../';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy

function repeat(count, fn) {
  for (let i = 1; i <= count; i++) {
    fn(i);
  }
}

function withoutId(obj) {
  const clone = xtend(obj);
  delete clone.id;
  return clone;
}

module.exports = function() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = createMap({ container });
  const fireSpy = spy(map, 'fire');
  const afterNextRender = createAfterNextRender(map);
  const Draw = GLDraw();
  map.addControl(Draw);

  function destroy() {
    document.body.removeChild(container);
  }

  function select(featureIds) {
    Draw.changeMode(Draw.modes.SIMPLE_SELECT, { featureIds: [].concat(featureIds) });
  }

  function directSelect(featureId, options) {
    Draw.changeMode(Draw.modes.DIRECT_SELECT, Object.assign({ featureId }, options));
  }

  function reset() {
    fireSpy.reset();
    Draw.deleteAll();
    Draw.changeMode(Draw.modes.SIMPLE_SELECT);
  }

  function flushDrawEvents() {
    const drawEvents = [];
    for (let i = 0; i < fireSpy.callCount; i++) {
      const eventName = fireSpy.getCall(i).args[0];
      if (typeof eventName !== 'string' || eventName.indexOf('draw.') !== 0) continue;
      // Ignore draw.render events for now
      if (eventName === 'draw.render') continue;
      drawEvents.push(eventName);
    }
    fireSpy.reset();
    return drawEvents;
  }

  // Only returns the first call
  function getEventCall(eventName) {
    for (let i = 0; i < fireSpy.callCount; i++) {
      const call = fireSpy.getCall(i);
      if (call.args[0] === eventName) return call;
    }
  }

  // Only returns the first call
  function getEventData(eventName) {
    const call = getEventCall(eventName);
    if (!call) return null;
    const eventData = xtend(call.args[1]);
    if (eventData.features) {
      eventData.features = eventData.features.map(withoutId);
    }
    return eventData;
  }

  // Only checks the first call
  function firedWith(assert, eventName, expectedEventData) {
    const call = getEventCall(eventName);

    if (call === undefined) {
      assert.fail(`${eventName} never called`);
      return {};
    }

    const actualEventData = xtend(call.args[1]);
    if (actualEventData.features) {
      actualEventData.features = actualEventData.features.map(withoutId);
    }

    assert.deepEqual(actualEventData, expectedEventData, 'with correct data');

    return actualEventData;
  }

  function drag(start, end, interval = 10) {
    map.fire('mousedown', makeMouseEvent(start[0], start[1]));
    const lngDiff = (end[0] - start[0]) / interval;
    const latDiff = (end[1] - start[1]) / interval;
    repeat(interval, i => {
      map.fire('mousemove', makeMouseEvent(
        start[0] + lngDiff * i,
        start[1] + latDiff * i,
        { which: 1 }
      ));
    });
    map.fire('mouseup', makeMouseEvent(end[0], end[1]));
  }

  function mousemove(start, end, interval = 10) {
    const lngDiff = (end[0] - start[0]) / interval;
    const latDiff = (end[1] - start[1]) / interval;
    repeat(interval, i => {
      map.fire('mousemove', makeMouseEvent(
        start[0] + lngDiff * i,
        start[1] + latDiff * i
      ));
    });
  }

  function boxSelect(start, end, interval = 10) {
    map.fire('mousedown', makeMouseEvent(start[0], start[1], { shiftKey: true }));
    const lngDiff = (end[0] - start[0]) / interval;
    const latDiff = (end[1] - start[1]) / interval;
    repeat(interval, i => {
      map.fire('mousemove', makeMouseEvent(
        start[0] + lngDiff * i,
        start[1] + latDiff * i,
        { which: 1 }
      ));
    });
    map.fire('mouseup', makeMouseEvent(end[0], end[1]));
  }

  function fire(eventName, eventData) {
    map.fire(eventName, eventData);
  }

  function dispatchContainerEvent() {
    const syntheticEvent = createSyntheticEvent.apply(null, arguments);
    container.dispatchEvent(syntheticEvent);
  }

  const testMap = {
    Draw,
    destroy,
    select,
    directSelect,
    reset,
    flushDrawEvents,
    getEventCall,
    getEventData,
    firedWith,
    mousemove,
    boxSelect,
    drag,
    fire,
    dispatchContainerEvent,
    awaitRender,
    click(x, y, options) {
      click(map, makeMouseEvent(x, y, options));
    },
    pointButton: container.getElementsByClassName('mapbox-gl-draw_point')[0],
    lineButton: container.getElementsByClassName('mapbox-gl-draw_line')[0],
    trashButton: container.getElementsByClassName('mapbox-gl-draw_trash')[0],
    polygonButton: container.getElementsByClassName('mapbox-gl-draw_polygon')[0],
    backspace() {
      dispatchContainerEvent('keydown', {
        keyCode: 8
      });
    },
    enter() {
      dispatchContainerEvent('keyup', {
        keyCode: 13
      });
    },
    escape() {
      dispatchContainerEvent('keyup', {
        keyCode: 27
      });
    }
  };

  function awaitRender() {
    return new Promise(resolve => {
      afterNextRender(() => resolve(testMap));
    });
  }

  return new Promise(resolve => {
    map.on('load', () => resolve(testMap));
  });
};
