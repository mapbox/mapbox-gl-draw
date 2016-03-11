var selectAll = function() {
  return true;
}

module.exports = function(ctx) {

  var onClick = function(e) {
    console.log('woot');
  }

  return {
    start: function() {
      this.on('onClick', selectAll, onClick);
    },
    stop: function() {
      console.log('I guess you don\' want to browse any more');
    }
  }
}
