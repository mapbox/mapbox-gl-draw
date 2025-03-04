import { spy } from 'sinon';

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
