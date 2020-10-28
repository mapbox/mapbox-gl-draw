export default function(features, map) {
  var sizes = [];
  var total = 0;
  features.forEach(feature => {
    feature.geometry.coordinates.forEach(ring => {
      sizes.push(ring.length);
      total += ring.length;
    });
  });

  var progressDiv = document.getElementById('progress');

  var one = 100/total;
  for (var i=0; i<sizes.length; i++) {
    sizes[i] = one*sizes[i];
  }

  var pos = 0;
  var lastDone = -1;
  map.on('progress', function(e) {
    if (e.done < lastDone) {
      pos++;
    }
    lastDone = e.done;
    var done = 0;
    for (var i=0; i<pos; i++) {
      done += sizes[i];
    }
    done += (sizes[pos] * e.done / 100);
    progressDiv.style.width = done+"%";
  });
}
