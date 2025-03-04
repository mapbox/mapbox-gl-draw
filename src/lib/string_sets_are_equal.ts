export const stringSetsAreEqual = (a: Array<string>, b: Array<string>) => {
  if (a.length !== b.length) return false;
  return (
    JSON.stringify(a.map(id => id).sort()) ===
    JSON.stringify(b.map(id => id).sort())
  );
}
