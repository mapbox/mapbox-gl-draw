
export default class Evented {
  on(type, listener) {
    if (!listener) {
      return new Promise(resolve => this.on(type, resolve));
    }

    this._listeners = this._listeners || {};
    this._listeners[type] = this._listeners[type] || [];
    this._listeners[type].push(listener);
    return this;
  }

  off(type, listener) {
    if (!this._listeners) return this;
    const listeners = this._listeners[type];
    if (!listeners) return this;
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
    return this;
  }

  fire(type, data) {
    if (!this._listeners) return this;
    const listeners = this._listeners[type];
    if (!this._listeners[type]) return;
    for (const listener of listeners) {
      listener.call(this, data);
    }
  }
}
