import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy

export default function createMockModeHandlerContext() {
  return {
    start: spy(),
    stop: spy(),
    trash: spy(),
    render: spy()
  };
}
