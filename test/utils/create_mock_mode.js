import { spy } from 'sinon';

export default function createMockModeHandlerContext() {
  return {
    start: spy(),
    stop: spy(),
    trash: spy(),
    render: spy()
  };
}
