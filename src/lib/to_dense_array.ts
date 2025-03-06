export const toDenseArray = (x: unknown): Array<string | number> => {
  return [].concat(x).filter(y => y !== undefined);
};
