import { spy } from 'sinon';

export default function createMockDrawModeContext() {
  const _store = {};

  const api = {
    store: {
      add(f) {
        _store[f.id] = f;
      },
      delete(id) {
        delete _store[id];
      },
      featureChanged: spy(),
      clearSelected: spy(),
      getAllIds() {
        return Object.keys(_store);
      },
      get(id) {
        return _store[id];
      }
    },
    events: {
      fire: spy(),
      changeMode: spy(),
      actionable: spy()
    },
    ui: {
      queueMapClasses: spy(),
      setActiveButton: spy()
    },
    map: {
      doubleClickZoom: {
        disable: spy(),
        enable: spy()
      },
      fire: spy()
    },
    _test: {}
  };

  spy(api.store, 'add');
  spy(api.store, 'delete');
  spy(api.store, 'get');

  return api;
}
