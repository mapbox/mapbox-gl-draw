import {customAlphabet} from 'nanoid/non-secure';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32);

export function generateID() {
  return nanoid();
}
