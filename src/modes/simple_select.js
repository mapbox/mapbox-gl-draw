const CommonSelectors = require('../lib/common_selectors');
const mouseEventPoint = require('../lib/mouse_event_point');
const featuresAt = require('../lib/features_at');
const createSupplementaryPoints = require('../lib/create_supplementary_points');
const StringSet = require('../lib/string_set');
const doubleClickZoom = require('../lib/double_click_zoom');
const moveFeatures = require('../lib/move_features');
const Constants = require('../constants');
const MultiFeature = require('../feature_types/multi_feature');

module.exports = function(ctx, options = {}) {
  let dragMoveLocation = null;
  let boxSelectStartLocation = null;
  let boxSelectElement;
  let boxSelecting = false;
  let canBoxSelect = false;
  let dragMoving = false;
  let canDragMove = false;

  const initiallySelectedFeatureIds = options.featureIds || [];

  const fireUpdate = function() {
    ctx.map.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.MOVE,
      features: ctx.store.getSelected().map(f => f.toGeoJSON())
    });
  };

  const fireActionable = () => {
    const selectedFeatures = ctx.store.getSelected();

    const multiFeatures = selectedFeatures.filter(
      feature => feature instanceof MultiFeature
    );

    let combineFeatures = false;

    if (selectedFeatures.length > 1) {
      combineFeatures = true;
      const featureType = selectedFeatures[0].type.replace('Multi', '');
      selectedFeatures.forEach(feature => {
        if (feature.type.replace('Multi', '') !== featureType) {
          combineFeatures = false;
        }
      });
    }

    const uncombineFeatures = multiFeatures.length > 0;
    const trash = selectedFeatures.length > 0;

    ctx.events.actionable({
      combineFeatures, uncombineFeatures, trash
    });
  };

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

    ctx.map.dragPan.enable();

    boxSelecting = false;
    canBoxSelect = false;
    dragMoving = false;
    canDragMove = false;
  };

  return {
    stop: function() {
      doubleClickZoom.enable(ctx);
    },
    start: function() {
      // Select features that should start selected,
      // probably passed in from a `draw_*` mode
      if (ctx.store) {
        ctx.store.setSelected(initiallySelectedFeatureIds.filter(id => {
          return ctx.store.get(id) !== undefined;
        }));
        fireActionable();
      }

      // Any mouseup should stop box selecting and dragMoving
      this.on('mouseup', CommonSelectors.true, stopExtendedInteractions);

      // On mousemove that is not a drag, stop extended interactions.
      // This is useful if you drag off the canvas, release the button,
      // then move the mouse back over the canvas --- we don't allow the
      // interaction to continue then, but we do let it continue if you held
      // the mouse button that whole time
      this.on('mousemove', CommonSelectors.true, stopExtendedInteractions);

      // As soon as you mouse leaves the canvas, update the feature
      this.on('mouseout', () => dragMoving, fireUpdate);

      // Click (with or without shift) on no feature
      this.on('click', CommonSelectors.noTarget, function() {
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
      this.on('click', CommonSelectors.isOfMetaType(Constants.meta.VERTEX), (e) => {
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
        // Stop any already-underway extended interactions
        stopExtendedInteractions();

        // Disable map.dragPan immediately so it can't start
        ctx.map.dragPan.disable();

        // Re-render it and enable drag move
        this.render(e.featureTarget.properties.id);

        // Set up the state for drag moving
        canDragMove = true;
        dragMoveLocation = e.lngLat;
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
          if (selectedFeatureIds.length === 1) {
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
      this.on('drag', () => canDragMove, (e) => {
        dragMoving = true;
        e.originalEvent.stopPropagation();

        const delta = {
          lng: e.lngLat.lng - dragMoveLocation.lng,
          lat: e.lngLat.lat - dragMoveLocation.lat
        };

        moveFeatures(ctx.store.getSelected(), delta);

        dragMoveLocation = e.lngLat;
      });

      // Mouseup, always
      this.on('mouseup', CommonSelectors.true, function(e) {
        // End any extended interactions
        if (dragMoving) {
          fireUpdate();
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
        this.on('mousedown', CommonSelectors.isShiftMousedown, (e) => {
          stopExtendedInteractions();
          ctx.map.dragPan.disable();
          // Enable box select
          boxSelectStartLocation = mouseEventPoint(e.originalEvent, ctx.container);
          canBoxSelect = true;
        });

        // Drag when box select is enabled
        this.on('drag', () => canBoxSelect, (e) => {
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
      geojson.properties.active = (ctx.store.isSelected(geojson.properties.id)) ?
        Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
      push(geojson);
      fireActionable();
      if (geojson.properties.active !== Constants.activeStates.ACTIVE ||
        geojson.geometry.type === Constants.geojsonTypes.POINT) return;
      createSupplementaryPoints(geojson).forEach(push);
    },
    trash: function() {
      ctx.store.delete(ctx.store.getSelectedIds());
      fireActionable();
    },
    combineFeatures: function() {
      const selectedFeatures = ctx.store.getSelected();

      if (selectedFeatures.length === 0 || selectedFeatures.length < 2) return;

      const coordinates = [], featuresCombined = [];
      const featureType = selectedFeatures[0].type.replace('Multi', '');

      for (let i = 0; i < selectedFeatures.length; i++) {
        const feature = selectedFeatures[i];

        if (feature.type.replace('Multi', '') !== featureType) {
          return;
        }
        if (feature.type.includes('Multi')) {
          feature.getCoordinates().forEach((subcoords) => {
            coordinates.push(subcoords);
          });
        } else {
          coordinates.push(feature.getCoordinates());
        }

        featuresCombined.push(feature.toGeoJSON());
      }

      if (featuresCombined.length > 1) {

        const multiFeature = new MultiFeature(ctx, {
          type: Constants.geojsonTypes.FEATURE,
          properties: featuresCombined[0].properties,
          geometry: {
            type: `Multi${featureType}`,
            coordinates: coordinates
          }
        });

        ctx.store.add(multiFeature);
        ctx.store.delete(ctx.store.getSelectedIds(), { silent: true });
        ctx.store.setSelected([multiFeature.id]);

        ctx.map.fire(Constants.events.COMBINE_FEATURES, {
          createdFeatures: [multiFeature.toGeoJSON()],
          deletedFeatures: featuresCombined
        });
      }
      fireActionable();
    },
    uncombineFeatures: function() {
      const selectedFeatures = ctx.store.getSelected();
      if (selectedFeatures.length === 0) return;

      const createdFeatures = [];
      const featuresUncombined = [];

      for (let i = 0; i < selectedFeatures.length; i++) {
        const feature = selectedFeatures[i];

        if (feature instanceof MultiFeature) {
          feature.getFeatures().forEach((subFeature) => {
            ctx.store.add(subFeature);
            subFeature.properties = feature.properties;
            createdFeatures.push(subFeature.toGeoJSON());
            ctx.store.select([subFeature.id]);
          });
          ctx.store.delete(feature.id, { silent: true });
          featuresUncombined.push(feature.toGeoJSON());
        }
      }

      if (createdFeatures.length > 1) {
        ctx.map.fire(Constants.events.UNCOMBINE_FEATURES, {
          createdFeatures: createdFeatures,
          deletedFeatures: featuresUncombined
        });
      }
      fireActionable();
    }
  };
};
