function throttle(fn, time, context) {
  let lock, args;

  function later () {
    // reset lock and call if queued
    lock = false;
    if (args) {
      wrapperFn.apply(context, args);
      args = false;
    }
  }

  function wrapperFn () {
    if (lock) {
      // called too soon, queue to call later
      // eslint-disable-next-line
      args = arguments;

    } else {
      // lock until later then call
      lock = true;
      // eslint-disable-next-line
      fn.apply(context, arguments);
      setTimeout(later, time);
    }
  }

  return wrapperFn;
}

module.exports = throttle;
