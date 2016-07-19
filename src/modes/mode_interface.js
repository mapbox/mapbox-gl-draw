

/******
 * Overview of the arguments of ModeInterface functions
 ************************
 * store {object} - is the store object (normally ctx.store)
 * ui {object} - is the ui object (normally ctx.ui)
 * event {object} - is the event that triggered this handler
      * mapPoint - a point that represents where the mouse is in pixel space
      * featureTarget - the feature under the mouse
      * originalEvent - the event that triggered this event
 * nextModeName {string} - the name of the mode being transitioned too
 * revertChanges {boolean} - if ture, the mode should try to undo its changes
 * geojson {object} - is the geojson representation of an internal feature.
 *     This MUST only have properties that match those covered
 *     in the `Styling Draw` section of the documentation
 * render {function} -  this function takes one geojson feature
 *     that matches the `Styling Draw` spec and adds it to the map
 */

export default class ModeInterface {
  constructor() {} // options, store, ui
  onClick () {} // event, store, ui
  onDrag () {} // event, store, ui
  onMousemove () {} // event, store, ui
  onMousedown () {} // event, store, ui
  onMouseup () {} // event, store, ui
  onKeydown () {} // event, store, ui
  onKeyup () {} // event, store, ui
  onTrash() {} // store, ui
  onChangeMode () {} // nextModeName, store, ui
  prepareAndRender () { // geojson, render, store, ui
    throw new Error('A mode must implement prepareAndRender');
  }
}

// this.doubleClickZoom(enable) if ture, set to enabled. If false, set to disabled.
// this.dragPan(enable) if ture, set to enabled. If false, set to disabled.
// events need to have points on them based on the container (mouseEventPoint(e.originalEvent, ctx.container);)
// this.appendChild() should add a dom node to the screen that will be cleaned up on mode change
// this.fire fires an event


// store.add
// store.getSelectedIds()
// store.getSelected()
// store.clearSelected()
// store.setSelected()
// store.featureChanged()
// store.isSelected()
// store.get()
// store.deselect()
// store.featuresAt()
// store.select()
// store.delete()






