import {mocks} from 'mock-browser';
const mock = new mocks.MockBrowser();

global.document = mock.getDocument();
global.window = {};

// Polyfill based on https://gist.github.com/paulirish/1579671
let lastTime = 0;
global.requestAnimationFrame = function(fn) {
  const now = Date.now();
  const nextTime = Math.max(lastTime + 16, now);
  setTimeout(() => fn(lastTime = nextTime), nextTime - now);
};
