// TODO: Remove the need for internal event handling
// by more clearly and explicitly defining the relationship
// between geometries, draw.js and the stores.

export default new (require('events').EventEmitter);
