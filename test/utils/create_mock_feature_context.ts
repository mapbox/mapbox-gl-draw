import { spy } from 'sinon';

/**
 * Returns an mock ctx object with just those properties a Feature
 * requires.
 *
 * @return {Object}
 */
export default function createMockFeatureContext(
  opts = { userProperties: false }
) {
  return {
    options: {
      userProperties: opts.userProperties
    },
    store: {
      featureChanged: spy()
    }
  };
}
