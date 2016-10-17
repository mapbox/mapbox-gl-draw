const Constants = require('../constants');

module.exports = (ctx, cb) => {
  const prevActionables = {
    combine: null, uncombine: null, trash: null
  }
  return () => {
    const nextActionables = cb();
    if (nextActionables.uncombine === prevActionables.uncombine &&
        nextActionables.combine === prevActionables.combine &&
        nextActionables.trash === prevActionables.trash) {
          return; // Nothing changed
    }
    ctx.map.fire(Constants.events.ACTIONABLE, nextActionables);
    Object.assign(prevActionables, nextActionables);
  }
}
