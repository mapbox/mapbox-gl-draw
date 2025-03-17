import { spy } from 'sinon';
import type { CTX, DrawStore } from '../../src/types/types';

/**
 * Returns an mock ctx object with just those properties a Feature
 * requires.
 *
 * @return {Object}
 */
export default function createMockFeatureContext(
  opts = { userProperties: false }
): CTX {
  return {
    options: {
      userProperties: opts.userProperties
    },
    store: {
      featureChanged: spy()
    } as unknown as DrawStore
  } as unknown as CTX;
}
