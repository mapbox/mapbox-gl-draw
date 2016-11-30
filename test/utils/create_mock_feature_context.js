import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy

/**
 * Returns an mock ctx object with just those properties a Feature
 * requires.
 *
 * @return {Object}
 */
export default function createMockFeatureContext(opts = { userProperties: false}) {
  return {
    options: {
      userProperties: opts.userProperties
    },
    store: {
      featureChanged: spy()
    }
  };
}
