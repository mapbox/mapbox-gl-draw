const Constants = require('../constants');

module.exports = function(ctx) {
  return {
    stop: function() {},
    start: function() {
      ctx.map.fire(Constants.events.ACTIONABLE, {
        combine: false,
        uncombine: false,
        trash: false
      });
    },
    render: function(geojson, push) {
      push(geojson);
    }
  };
};
