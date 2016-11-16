const MockBrowser = require('mock-browser').mocks.MockBrowser;
const mock = new MockBrowser();

global.document = mock.getDocument();
global.window = {};
global.requestAnimationFrame = function(fn) {
  setTimeout(fn, 16);
};
