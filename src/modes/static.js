module.exports = function() {
  return {
    stop: function() {},
    start: function() {},
    render: function(geojson, push) {
      push(geojson);
    }
  };
};
