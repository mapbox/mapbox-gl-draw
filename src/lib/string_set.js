function StringSet(items) {
  this._items = {};
  if (!items) return;
  for (var i = 0, l = items.length; i < l; i++) {
    if (items[i] === undefined) continue;
    this._items[items[i]] = String(items[i]);
  }
}

StringSet.prototype.add = function(x) {
  this._items[x] = String(x);
  return this;
};

StringSet.prototype.delete = function(x) {
  delete this._items[x];
  return this;
};

StringSet.prototype.has = function(x) {
  return this._items[x] !== undefined;
};

StringSet.prototype.values = function() {
  return Object.keys(this._items);
};

StringSet.prototype.clear = function() {
  this._items = {};
  return this;
};

module.exports = StringSet;
