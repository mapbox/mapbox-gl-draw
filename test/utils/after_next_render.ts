const TIMEOUT = 1000;

export function setupAfterNextRender(map) {
  let render = 0;
  map.on('draw.render', () => {
    render++;
  });

  const controller = new AbortController();
  const signal = AbortSignal.timeout(TIMEOUT);
  signal.addEventListener('abort', () => controller.abort());

  return function afterNextRender(msg) {
    return new Promise((resolve, reject) => {
      const lastRender = render;
      const id = setInterval(() => {
        if (controller.signal.aborted) {
          const error = `draw.render event did not fire within ${TIMEOUT}ms`;
          reject(new Error(msg ? `${msg}: ${error}` : error));
        }

        if (lastRender < render) {
          clearInterval(id);
          resolve();
        }
      });
    });
  };
}
