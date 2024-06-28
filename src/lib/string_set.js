function StringSet(items) {
  this._items = {};
  this._nums = {};
  this._length = items ? items.length : 0;
  if (!items) return;
  for (let i = 0, l = items.length; i < l; i++) {
    this.add(items[i]);
    if (items[i] === undefined) continue;
    if (typeof items[i] === 'string') this._items[items[i]] = i;
    else this._nums[items[i]] = i;

  }
}

StringSet.prototype.add = function(x) {
  if (this.has(x)) return this;
  this._length++;
  if (typeof x === 'string') this._items[x] = this._length;
  else this._nums[x] = this._length;
  return this;
};

StringSet.prototype.delete = function(x) {
  if (this.has(x) === false) return this;
  this._length--;
  delete this._items[x];
  delete this._nums[x];
  return this;
};

StringSet.prototype.has = function(x) {
  if (typeof x !== 'string' && typeof x !== 'number') return false;
  return this._items[x] !== undefined || this._nums[x] !== undefined;
};

StringSet.prototype.values = function() {
  const values = [];
  Object.keys(this._items).forEach((k) => {
    values.push({ k, v: this._items[k] });
  });
  Object.keys(this._nums).forEach((k) => {
    values.push({ k: JSON.parse(k), v: this._nums[k] });
  });

  return values.sort((a, b) => a.v - b.v).map(a => a.k);
};

StringSet.prototype.clear = function() {
  this._length = 0;
  this._items = {};
  this._nums = {};
  return this;
};

export default StringSet;
