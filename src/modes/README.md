# Draw Modes

Draw modes describe the core functionality of Draw. A Draw container is a function which takes two arguments (context, options) and returns an object with `start`, `stop` and `render` life cycle handlers. These properties must all be functions and should perform the use cases described in the handlers section.

```js
module.exports = function(context, options) {
  var runningTime = 0;
  return {
    start: function() {
      this.on('mousedown', function() {
        context.api.changeMode('default');
      });
      intervalId = setInterval(function() {
        runningTime += 1;
        context.store.render();
      }, 1000);
    },
    stop: function() {
      clearInterval(intervalId);
    },
    render: function(geojson) {
      geojson.properties.runningTime = runningTime;
    }
  }
}
```

## Arguments

**Context**

Context is a singleton variable passed around Draw. This variable is a collection of internal apis, used to control Draws state, UI, modes, events and more. In the context of Modes, the context variable provides `context.store` which is the instance for Draw's store. This can be used for getting and updating user provided features. `context.api` is the external api for Draw. This should be used for changing modes.

**Options**

`Draw.changeMode` allows a developer to provide one argument to a mode. This argument will be passed to the mode via the `options` argument.

## Life cycle functions

These functions are called by Draw at different points in the Draw life cycle.

### `start()`

Start is invoked after the last mode has been stopped. It is invoked once. `this.on` should be used inside of start to wire up event handlers.

Start does not take any arguments. Nothing should be returned.

### `stop()`

Stop is invoked when `changeMode` is called. It is invoked even if the current mode is the same as the next mode. `this.off` does not need to be used inside of stop to destroy event handlers as the mode system will does this for you.

### `render(geosjson)`

Whenever a render happens while this mode is active, render will be called. Render is called for each Feature in the store at the time of the render. Render can return the passed geojson object, or an array of geojson objects. This should be used to add visual elements to the map such as handles and edge highlights. If the current state of a feature is invalid (ie: Polygons with only two points) the render function should fix this feature before returning it. Properties on created geojson objects should follow the list of features described in [the styling section of API.md](../../API.md#styling-draw)


