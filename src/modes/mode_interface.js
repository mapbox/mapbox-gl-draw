

/******
 * Overview of the arguments of ModeInterface functions
 ************************
 * store {object} - is the store object (normally ctx.store)
 * ui {object} - is the ui object (normally ctx.ui)
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
  constructor() {} // store, ui
  onClick () {} // event, store, ui
  onDrag () {} // event, store, ui
  onMousemove () {} // event, store, ui
  onMousedown () {} // event, store, ui
  onMouseup () {} // event, store, ui
  onKeydown () {} // event, store, ui
  onKeyup () {} // event, store, ui
  changeMode () {} // nextModeName, revertChanges, store, ui
  prepareAndRender () { // geojson, render, store, ui
    throw new Error('A mode must implement prepareAndRender');
  }
}
