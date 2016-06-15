function SimpleSet(items) {
  this._items = items || [];
}

SimpleSet.prototype.add = function(item) {
  if (this._items.indexOf(item) !== -1) return;
  this._items.push(item);
  return this;
};

SimpleSet.prototype.delete = function(item) {
  var itemIndex = this._items.indexOf(item);
  if (itemIndex === -1) return;
  this._items.splice(itemIndex, 1);
  return this;
};

SimpleSet.prototype.has = function(item) {
  return this._items.indexOf(item) !== -1;
};

SimpleSet.prototype.values = function() {
  return this._items;
};

SimpleSet.prototype.clear = function() {
  this._items = [];
  return this;
};

module.exports = SimpleSet;
