import { spy } from 'sinon';

export default function createMockLifecycleContext() {
  return {
    on: spy()
  };
}
