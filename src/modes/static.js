module.exports = function(ctx) {
  return {
    stop: function() {},
    start: function() {
      ctx.events.actionable({
        combineFeatures: false,
        uncombineFeatures: false,
        trash: false
      });
    },
    render: function(geojson, push) {
      push(geojson);
    }
  };
};
