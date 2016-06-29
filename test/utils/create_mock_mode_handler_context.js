import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy

export default function createMockModeHandlerContext() {
  return {
    store: {
      featureChanged: spy(),
      render: spy()
    },
    ui: {
      updateMapClasses: spy()
    }
  };
}
