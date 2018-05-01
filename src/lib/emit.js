/*
 * Wrapper function to handle the function signature changing between mapboxgl
 * version 0.45.0 and above.
 */
function emit(event, ctx) {
  const version = parseFloat(ctx.options.mapboxglVersion);
  const type = event.type;
  const fn = ctx.map.fire;

  function wrapperFn () {
    if (version >= 0.45) {
      fn.apply(ctx, event);
    } else {
      delete event.type;
      fn.apply(ctx, type, event);
    }
  }

  return wrapperFn;
}

module.exports = emit;
