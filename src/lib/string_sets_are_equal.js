module.exports = function(a, b) {
  return JSON.stringify(a.sort()) === JSON.stringify(b.sort());
};
