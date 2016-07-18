

/******
 * Overview of the arguments of ModeInterface functions
 ************************
 * store {object} - is the store object (normally ctx.store)
 * ui {object} - is the ui object (normally ctx.ui)
 * map {object} - the mapbox-gl-js map object
 * event {object} - is the event that triggered this handler
 * nextModeName {string} - the name of the mode being transitioned too
 * revertChanges {boolean} - if ture, the mode should try to undo its changes
 * geojson {object} - is the geojson representation of an internal feature.
 *     This MUST only have properties that match those covered
 *     in the `Styling Draw` section of the documentation
 * render {function} -  this function takes one geojson feature
 *     that matches the `Styling Draw` spec and adds it to the map
 */

export default class ModeInterface {
  constructor() {} // store, ui, map
  onClick () {} // event, store, ui, map
  onDrag () {} // event, store, ui, map
  onMousemove () {} // event, store, ui, map
  onMousedown () {} // event, store, ui, map
  onMouseup () {} // event, store, ui, map
  onKeydown () {} // event, store, ui, map
  onKeyup () {} // event, store, ui, map
  onTrash() {} // store, ui, map
  changeMode () {} // nextModeName, store, ui, map
  prepareAndRender () { // geojson, render, store, ui, map
    throw new Error('A mode must implement prepareAndRender');
  }
}
