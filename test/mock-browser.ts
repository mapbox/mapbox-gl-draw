import { spy } from 'sinon';
import MockBrowser from 'mock-browser';
const mock = new MockBrowser.mocks.MockBrowser();

global.document = mock.getDocument();
(global.window as spy) = {};

// Polyfill based on https://gist.github.com/paulirish/1579671
let lastTime = 0;
(global as spy).requestAnimationFrame = fn => {
  const now = Date.now();
  const nextTime = Math.max(lastTime + 16, now);
  setTimeout(() => fn((lastTime = nextTime)), nextTime - now);
};
