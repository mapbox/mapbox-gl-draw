export default function tap(map, payload) {
  map.fire('touchstart', payload);
  map.fire('touchend', payload);
}
