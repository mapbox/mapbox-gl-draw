class StringSet {
  private _items: Record<string, number>;
  private _nums: Record<number, number>;
  private _length: number;

  constructor(items?: (string | number)[]) {
    this._items = {};
    this._nums = {};
    this._length = items ? items.length : 0;

    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      this.add(items[i]);
      if (items[i] === undefined) continue;
      if (typeof items[i] === 'string') this._items[items[i]] = i;
      else this._nums[items[i]] = i;
    }
  }

  add(x: string | number): this {
    if (this.has(x)) return this;
    this._length++;
    if (typeof x === 'string') this._items[x] = this._length;
    else this._nums[x] = this._length;
    return this;
  }

  delete(x: string | number): this {
    if (!this.has(x)) return this;
    this._length--;
    delete this._items[x as string];
    delete this._nums[x as number];
    return this;
  }

  has(x: unknown): boolean {
    if (typeof x !== 'string' && typeof x !== 'number') return false;
    return this._items[x as string] !== undefined || this._nums[x as number] !== undefined;
  }

  values(): (string | number)[] {
    const values: { k: string | number; v: number }[] = [];
    
    Object.keys(this._items).forEach(k => {
      values.push({ k, v: this._items[k] });
    });
    
    Object.keys(this._nums).forEach(k => {
      values.push({ k: JSON.parse(k), v: this._nums[+k] });
    });

    return values.sort((a, b) => a.v - b.v).map(a => a.k);
  }

  clear(): this {
    this._length = 0;
    this._items = {};
    this._nums = {};
    return this;
  }
}

export default StringSet;
