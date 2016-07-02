const CommonSelectors = require('../lib/common_selectors');
const mouseEventPoint = require('../lib/mouse_event_point');
const featuresAt = require('../lib/features_at');
const createSupplementaryPoints = require('../lib/create_supplementary_points');
const StringSet = require('../lib/string_set');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');

module.exports = function(ctx, options = {}) {
  let dragMoveStartLocation = null;
  let featureCoords = null;
  let boxSelectStartLocation = null;
  let boxSelectElement;
  let boxSelecting = false;
  let canBoxSelect = false;
  let dragMoving = false;
  let canDragMove = false;

  const initiallySelectedFeatureIds = options.featureIds || [];

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

  const stopExtendedInteractions = function() {
    if (boxSelectElement) {
      if (boxSelectElement.parentNode) boxSelectElement.parentNode.removeChild(boxSelectElement);
      boxSelectElement = null;
    }

    setTimeout(() => {
      ctx.map.dragPan.enable();
    }, 0);

    boxSelecting = false;
    canBoxSelect = false;
    dragMoving = false;
    canDragMove = false;
    featureCoords = null;
  };

  return {
    stop: function() {
      doubleClickZoom.enable(ctx);
    },
    start: function() {
      // Select features that should start selected,
      // probably passed in from a `draw_*` mode
      if (ctx.store) ctx.store.setSelected(initiallySelectedFeatureIds.filter(id => {
        return ctx.store.get(id) !== undefined;
      }));

      // Any mouseup should stop box selecting and dragMoving
      this.on('mouseup', CommonSelectors.true, stopExtendedInteractions);

      // Click (with or without shift) on no feature
      this.on('click', CommonSelectors.noFeature, function() {
        // Clear the re-render selection
        const wasSelected = ctx.store.getSelectedIds();
        if (wasSelected.length) {
          ctx.store.clearSelected();
          wasSelected.forEach(id => this.render(id));
        }
        doubleClickZoom.enable(ctx);
        stopExtendedInteractions();
      });

      // Click (with or without shift) on a vertex
      this.on('click', CommonSelectors.isOfMetaType(Constants.meta.VERTEX), function(e) {
        // Enter direct select mode
        ctx.events.changeMode(Constants.modes.DIRECT_SELECT, {
          featureId: e.featureTarget.properties.parent,
          coordPath: e.featureTarget.properties.coord_path,
          startPos: e.lngLat
        });
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
      });

      // Mousedown on a selected feature
      this.on('mousedown', CommonSelectors.isActiveFeature, function(e) {
        stopExtendedInteractions();
        // Re-render it and enable drag move
        this.render(e.featureTarget.properties.id);
        canDragMove = true;
        dragMoveStartLocation = e.lngLat;
      });

      // Click (with or without shift) on any feature
      this.on('click', CommonSelectors.isFeature, function(e) {
        // Stop everything
        doubleClickZoom.disable(ctx);
        stopExtendedInteractions();

        const isShiftClick = CommonSelectors.isShiftDown(e);
        const selectedFeatureIds = ctx.store.getSelectedIds();
        const featureId = e.featureTarget.properties.id;
        const isFeatureSelected = ctx.store.isSelected(featureId);

        // Click (without shift) on any selected feature but a point
        if (!isShiftClick && isFeatureSelected && ctx.store.get(featureId).type !== Constants.geojsonTypes.POINT) {
          // Enter direct select mode
          return ctx.events.changeMode(Constants.modes.DIRECT_SELECT, {
            featureId: featureId
          });
        }

        // Shift-click on a selected feature
        if (isFeatureSelected && isShiftClick) {
          // Deselect it
          ctx.store.deselect(featureId);
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
          if (selectedFeatureIds.length === 1 ) {
            doubleClickZoom.enable(ctx);
          }
        // Shift-click on an unselected feature
        } else if (!isFeatureSelected && isShiftClick) {
          // Add it to the selection
          ctx.store.select(featureId);
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
        // Click (without shift) on an unselected feature
        } else if (!isFeatureSelected && !isShiftClick) {
          // Make it the only selected feature
          selectedFeatureIds.forEach(this.render);
          ctx.store.setSelected(featureId);
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
        }

        // No matter what, re-render the clicked feature
        this.render(featureId);
      });

      // Dragging when drag move is enabled
      this.on('drag', () => canDragMove, function(e) {
        dragMoving = true;
        e.originalEvent.stopPropagation();

        // Change coordinates of all selected features

        if (featureCoords === null) {
          featureCoords = ctx.store.getSelectedIds()
            .map(id => ctx.store.get(id).getCoordinates());
        }

        const lngD = e.lngLat.lng - dragMoveStartLocation.lng;
        const latD = e.lngLat.lat - dragMoveStartLocation.lat;

        const coordMap = (coord) => [coord[0] + lngD, coord[1] + latD];
        const ringMap = (ring) => ring.map(coord => coordMap(coord));
        const mutliMap = (multi) => multi.map(ring => ringMap(ring));

        ctx.store.getSelected().forEach((feature, i) => {
          if (feature.type === Constants.geojsonTypes.POINT) {
            feature.incomingCoords(coordMap(featureCoords[i]));
          } else if (feature.type === Constants.geojsonTypes.LINE_STRING || feature.type === Constants.geojsonTypes.MULTI_POINT) {
            feature.incomingCoords(featureCoords[i].map(coordMap));
          } else if (feature.type === Constants.geojsonTypes.POLYGON || feature.type === Constants.geojsonTypes.MULTI_LINE_STRING) {
            feature.incomingCoords(featureCoords[i].map(ringMap));
          } else if (feature.type === Constants.geojsonTypes.MULTI_POLYGON) {
            feature.incomingCoords(featureCoords[i].map(mutliMap));
          }
        });
      });

      // Mouseup, always
      this.on('mouseup', CommonSelectors.true, function(e) {
        // End any extended interactions
        if (dragMoving) {
          ctx.map.fire(Constants.events.UPDATE, {
            action: Constants.updateActions.MOVE,
            features: ctx.store.getSelected().map(f => f.toGeoJSON())
          });
        } else if (boxSelecting) {
          const bbox = [
            boxSelectStartLocation,
            mouseEventPoint(e.originalEvent, ctx.container)
          ];
          const featuresInBox = featuresAt(null, bbox, ctx);
          const idsToSelect = getUniqueIds(featuresInBox)
            .filter(id => !ctx.store.isSelected(id));

          if (idsToSelect.length) {
            ctx.store.select(idsToSelect);
            idsToSelect.forEach(this.render);
            ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
          }
        }
        stopExtendedInteractions();
      });

      if (ctx.options.boxSelect) {
        // Shift-mousedown anywhere
        this.on('mousedown', CommonSelectors.isShiftMousedown, function(e) {
          stopExtendedInteractions();
          // Enable box select
          ctx.map.dragPan.disable();
          boxSelectStartLocation = mouseEventPoint(e.originalEvent, ctx.container);
          canBoxSelect = true;
        });

        // Drag when box select is enabled
        this.on('drag', () => canBoxSelect, function(e) {
          boxSelecting = true;
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });

          // Create the box node if it doesn't exist
          if (!boxSelectElement) {
            boxSelectElement = document.createElement('div');
            boxSelectElement.classList.add(Constants.classes.BOX_SELECT);
            ctx.container.appendChild(boxSelectElement);
          }

          // Adjust the box node's width and xy position
          const current = mouseEventPoint(e.originalEvent, ctx.container);
          const minX = Math.min(boxSelectStartLocation.x, current.x);
          const maxX = Math.max(boxSelectStartLocation.x, current.x);
          const minY = Math.min(boxSelectStartLocation.y, current.y);
          const maxY = Math.max(boxSelectStartLocation.y, current.y);
          const translateValue = `translate(${minX}px, ${minY}px)`;
          boxSelectElement.style.transform = translateValue;
          boxSelectElement.style.WebkitTransform = translateValue;
          boxSelectElement.style.width = `${maxX - minX}px`;
          boxSelectElement.style.height = `${maxY - minY}px`;
        });
      }
    },
    render: function(geojson, push) {
      geojson.properties.active = (ctx.store.isSelected(geojson.properties.id) )
        ? Constants.activeStates.ACTIVE
        : Constants.activeStates.INACTIVE;
      push(geojson);
      if (geojson.properties.active !== Constants.activeStates.ACTIVE
        || geojson.geometry.type === Constants.geojsonTypes.POINT) return;
      createSupplementaryPoints(geojson).forEach(push);
    },
    trash() {
      featureCoords = null;
      ctx.store.delete(ctx.store.getSelectedIds());
    }
  };
};
