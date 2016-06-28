module.exports = function(ctx, startingSelectedIds) {
  return {
    stop: function() {
      ctx.map.doubleClickZoom.enable();
    },
    start: function() {},
    render: function(geojson, push) {
      push(geojson)
    }
  };
};
