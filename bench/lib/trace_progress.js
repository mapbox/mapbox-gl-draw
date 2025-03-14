export default function(features, map) {
  const sizes = [];
  let total = 0;
  for (const feature of features) {
    for (const ring of feature.geometry.coordinates) {
      sizes.push(ring.length);
      total += ring.length;
    }
  }

  const progressDiv = document.getElementById('progress');

  const one = 100 / total;
  for (let i = 0; i < sizes.length; i++) {
    sizes[i] = one * sizes[i];
  }

  let pos = 0;
  let lastDone = -1;

  map.on('progress', (e) => {
    if (e.done < lastDone) {
      pos++;
    }
    lastDone = e.done;
    let done = 0;
    for (let i = 0; i < pos; i++) {
      done += sizes[i];
    }
    done += (sizes[pos] * e.done / 100);
    progressDiv.style.width = `${done}%`;
  });
}
