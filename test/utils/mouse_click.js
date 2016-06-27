export default function click(map, payload) {
  map.fire('mousedown', payload);
  map.fire('mouseup', payload);
}
