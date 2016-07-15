import ModeInterface from './mode_interface';

export default class StaticMode extends ModeInterface {
  prepareAndRender(geojson, render) {
    render(geojson);
  }
}
