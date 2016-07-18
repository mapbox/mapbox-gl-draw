const CommonSelectors = require('../lib/common_selectors');
const mouseEventPoint = require('../lib/mouse_event_point');
const createSupplementaryPoints = require('../lib/create_supplementary_points');
const StringSet = require('../lib/string_set');
const moveFeatures = require('../lib/move_features');
const Constants = require('../constants');

const getUniqueIds = function(allFeatures) {
  if (!allFeatures.length) return [];
  const ids = allFeatures.map(s => s.properties.id)
    .filter(id => id !== undefined)
    .reduce((memo, id) => {
      memo.add(id);
      return memo;
    }, new StringSet());

  return ids.values();
};

export default class SimpleSelectMode extends ModeInterface {
  constructor (options, store, ui) {
    this.boxSelectIsOn = options.boxSelect;
    this.dragMoveLocation = null;
    this.boxSelectStartLocation = null;
    this.boxSelectElement;
    this.boxSelecting = false;
    this.canBoxSelect = false;
    this.dragMoving = false;
    this.canDragMove = false;
    this.initiallySelectedFeatureIds = options.featureIds || [];
  }
  stopExtendedInteractions() {
    if (this.boxSelectElement) {
      if (this.boxSelectElement.parentNode) this.boxSelectElement.parentNode.removeChild(this.boxSelectElement);
      this.boxSelectElement = null;
    }

    this.dragPan(true);

    this.boxSelecting = false;
    this.canBoxSelect = false;
    this.dragMoving = false;
    this.canDragMove = false;
  }

  changeMode (nextModeName, store, ui) {
    this.doubleClickZoom(true);
  }

  onMouseUp(e, store, ui) {
    // Any mouseup should stop box selecting and dragMoving
    this.stopExtendedInteractions();
  }

  // On mousemove that is not a drag, stop extended interactions.
  // This is useful if you drag off the canvas, release the button,
  // then move the mouse back over the canvas --- we don't the
  // interaction to continue (but we do let it continue if you held
  // the mouse button that whole time)
  onMousemove(e, store, ui) {
    this.stopExtendedInteractions();
  }

  onClick(e, store, ui) {
    if (CommonSelectors.noTarget(e)) {
      // Clear the re-render selection
      const wasSelected = store.getSelectedIds();
      if (wasSelected.length) {
        store.clearSelected();
        wasSelected.forEach(id => this.render(id));
      }
      this.doubleClickZoom(true);
      return this.stopExtendedInteractions();
    }

    if (CommonSelectors.isVertex(e)) {
      // how does this handle coords
      store.setSelected([e.featureTarget.properties.parent], [e.featureTarget.properties.coord_path]);
      this.changeMode(Constants.modes.DIRECT_SELECT);
      ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
    }
  }

  onMousedown(e, store, ui) {
    // Mousedown on a selected feature
    if (CommonSelectors.isActiveFeature(e)) {
      // Stop any already-underway extended interactions
      this.stopExtendedInteractions();

     // Disable map.dragPan immediately so it can't start
      this.dragPan(false);

      // Re-render it and enable drag move
      store.featureChanged(e.featureTarget.properties.id);

      // Set up the state for drag moving
      this.canDragMove = true;
      this.dragMoveLocation = e.lngLat;
      return;
    }

    if (CommonSelectors.isShiftMousedown(e) && this.boxSelectIsOn) {
      this.stopExtendedInteractions();
      this.dragPan(false);
      // Enable box select
      this.boxSelectStartLocation = e.mapPoint;
      this.canBoxSelect = true;
    }
  }

  onClick(e, store, ui) {
    // Click (with or without shift) on any feature
    if (CommonSelectors.isFeature(e)) {
      // Stop everything
      this.doubleClickZoom(false);
      this.stopExtendedInteractions();

      const isShiftClick = CommonSelectors.isShiftDown(e);
      const selectedFeatureIds = store.getSelectedIds();
      const featureId = e.featureTarget.properties.id;
      const isFeatureSelected = store.isSelected(featureId);

      // Click (without shift) on any selected feature but a point
      if (!isShiftClick && isFeatureSelected && store.get(featureId).type !== Constants.geojsonTypes.POINT) {
        // Enter direct select mode
        store.setSelected([featureId]);
        this.changeMode(Constants.modes.DIRECT_SELECT);
      }

      // Shift-click on a selected feature
      if (isFeatureSelected && isShiftClick) {
        // Deselect it
        store.deselect(featureId);
        ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
        if (selectedFeatureIds.length === 1 ) {
          this.doubleClickZoom(true);
        }
      // Shift-click on an unselected feature
      } else if (!isFeatureSelected && isShiftClick) {
        // Add it to the selection
        store.select(featureId);
        ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
      // Click (without shift) on an unselected feature
      } else if (!isFeatureSelected && !isShiftClick) {
        // Make it the only selected feature
        selectedFeatureIds.forEach(this.render);
        store.setSelected(featureId);
        ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
      }

      // No matter what, re-render the clicked feature
      store.featureChanged(featureId);
    }
  }

  onDrag (e, store, ui) {
    // Dragging when drag move is enabled
    if (this.canDragMove) {
      this.dragMoving = true;
      e.originalEvent.stopPropagation();

      const delta = {
        lng: e.lngLat.lng - dragMoveLocation.lng,
        lat: e.lngLat.lat - dragMoveLocation.lat
      };

      moveFeatures(store.getSelected(), delta);

      this.dragMoveLocation = e.lngLat;
    }

    if (this.canBoxSelect === true && this.boxSelectIsOn) {
      this.boxSelecting = true;
      ui.queueMapClasses({ mouse: Constants.cursors.ADD });

      // Create the box node if it doesn't exist
      if (!this.boxSelectElement) {
        this.boxSelectElement = document.createElement('div');
        this.boxSelectElement.classList.add(Constants.classes.BOX_SELECT);
        this.appendChild(boxSelectElement);
      }

      // Adjust the box node's width and xy position
      const current = e.mousePoint;
      const minX = Math.min(this.boxSelectStartLocation.x, current.x);
      const maxX = Math.max(this.boxSelectStartLocation.x, current.x);
      const minY = Math.min(this.boxSelectStartLocation.y, current.y);
      const maxY = Math.max(this.boxSelectStartLocation.y, current.y);
      const translateValue = `translate(${minX}px, ${minY}px)`;
      this.boxSelectElement.style.transform = translateValue;
      this.boxSelectElement.style.WebkitTransform = translateValue;
      this.boxSelectElement.style.width = `${maxX - minX}px`;
      this.boxSelectElement.style.height = `${maxY - minY}px`;
    }

  }

  onMouseup(e, store, ui) {
    if (this.dragMoving) {
      this.fire(Constants.events.UPDATE, {
        action: Constants.updateActions.MOVE,
        features: store.getSelected().map(f => f.toGeoJSON())
      });
      return stopExtendedInteractions();
    }

    if (this.boxSelecting) {
      const bbox = [
        this.boxSelectStartLocation,
        e.mousePoint
      ];
      const featuresInBox = store.featuresAt(bbox);
      const idsToSelect = getUniqueIds(featuresInBox)
        .filter(id => !store.isSelected(id));

      if (idsToSelect.length) {
        store.select(idsToSelect);
        idsToSelect.forEach(this.render);
        ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
      }
    }
    return stopExtendedInteractions();
  }

  prepareAndRender(geojson, render, store) {
    geojson.properties.active = (store.isSelected(geojson.properties.id) )
      ? Constants.activeStates.ACTIVE
      : Constants.activeStates.INACTIVE;
    render(geojson);
    if (geojson.properties.active !== Constants.activeStates.ACTIVE
      || geojson.geometry.type === Constants.geojsonTypes.POINT) return;
    createSupplementaryPoints(geojson).forEach(render);
  }

  onTrash(store) {
    store.delete(store.getSelectedIds());
  }
}
