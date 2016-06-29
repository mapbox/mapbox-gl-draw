module.exports = function(ctx) {
  return {
    stop: function() {
      ctx.map.doubleClickZoom.enable();
    },
    start: function() {},
    render: function(geojson, push) {
      push(geojson);
    }
  };
};
