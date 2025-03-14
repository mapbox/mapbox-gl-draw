export default function(start) {
  const path = [];

  for (let i = 0; i < 7; i += .04) {
    const A = 3;
    const B = Math.PI / 2;
    const SIZE = 100;
    const OFFSET = 5;

    const x = start.x + (Math.sin(i) * SIZE) + (i * OFFSET);
    const y = start.y + (Math.sin(A * i + B) * SIZE) + (i * OFFSET);
    path.push({x, y});
  }

  return path;
}
