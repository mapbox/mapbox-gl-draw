import R from 'ramda';
import { DOM } from './util';

const ENTER = 13;          // (enter)
const SHIFT_KEY = 16;      // (shift)
const SQUARE_KEY = 83;     // (s)
const DELETE_KEY = 68;     // (d)
const MARKER_KEY = 77;     // (m)
const POLYGON_KEY = 80;    // (p)
const DESELECT_KEY = 27;  // (esc)
const LINESTRING_KEY = 76; // (l)

export default function(ctx) {
  var isMouseDown = false;
  var dragStartPoint = null;
  var isShiftDown = false;
  var newFeature = null;
  var activeVertex = null;
  var activeDrawId = null;

  var cleanupNewFeatureIfNeeded = function() {
     if (newFeature.created) {
        ctx._handleDrawFinished();
        newFeature = null;
      }
  };

  var api = {
    setNewFeature: function(value) {
      newFeature = value;
    },
    onMouseDown: function(e) {
      isMouseDown = true;
      if (newFeature) {
        newFeature.onMouseDown(e);
        ctx._store.renderSelected();
        cleanupNewFeatureIfNeeded();
      }
      else {
        dragStartPoint = DOM.mousePos(e, ctx._map._container);

        var drawIds = ctx._store.getSelectedIds();
        if (newFeature === null && drawIds.length > 0) {
          var coords = DOM.mousePos(e, ctx._map._container);
          ctx._map.featuresAt([coords.x, coords.y], { radius: 20 }, (err, features) => {
            if(err) throw err;
            features = features.filter(feature => drawIds.indexOf(feature.properties.drawId || feature.properties.parent) > -1);
            if (features.length > 0) {
              var tempVertex = R.find(feat => feat.properties.meta === 'midpoint')(features);

              if(tempVertex) {
                ctx._store.get(tempVertex.properties.parent)
                  .addVertex(coords, tempVertex.properties.index);
                activeVertex = tempVertex;
                ctx._store.renderSelected();
              }
              else {
                activeVertex = R.find(feat => feat.properties.meta === 'vertex')(features) || null;
              }

              if (activeVertex === null) {
                activeDrawId = R.find(feat => feat.properties.drawId)(features).properties.drawId;
              }
            }
          });
        }
      }
    },
    onMouseUp: function(e) {
      isMouseDown = false;
      if (newFeature) {
        newFeature.onMouseUp(e);
        ctx._store.renderSelected();
        cleanupNewFeatureIfNeeded();
      }
      else {

        if(isShiftDown && activeVertex === null && activeDrawId === null) {
          var end = DOM.mousePos(e, ctx._map.getContainer());
          ctx._store.selectFeaturesIn(dragStartPoint, end);
          ctx._showDeleteButton();
        }

        if (activeVertex) {
          ctx._store.get(activeVertex.properties.parent).movingVertex = false;
        }

        activeVertex = null;

        if (activeDrawId) {
          ctx._store.get(activeDrawId).translating = false;
        }

        activeDrawId = null;
      }

      dragStartPoint = null;
    },
    onMouseMove: function(e) {
      if(isMouseDown) {
        return api.onMouseDrag(e);
      }
      else if (newFeature) {
        e.originalEvent.stopPropagation();
        newFeature.onMouseMove(e);
        ctx._store.renderSelected();
        cleanupNewFeatureIfNeeded();
      }
    },
    onMouseDrag: function(e) {
      if(newFeature) {
        e.originalEvent.stopPropagation();
        newFeature.onMouseDrag(e, dragStartPoint);
        ctx._store.renderSelected();
        cleanupNewFeatureIfNeeded();
      }
      else {
        var curr = DOM.mousePos(e.originalEvent, ctx._map.getContainer());
        if (activeVertex) {
          e.originalEvent.stopPropagation();
          ctx._store.get(activeVertex.properties.parent)
            .moveVertex(dragStartPoint, curr, activeVertex.properties.index);
          ctx._store.renderSelected();
        }
        else if (activeDrawId) {
          e.originalEvent.stopPropagation();
          ctx._store.get(activeDrawId).translate(dragStartPoint, curr);
          ctx._store.renderSelected();
        }
      }
    },
    onClick: function(e) {
      if (newFeature) {
        newFeature.onClick(e);
        ctx._store.renderSelected();
        cleanupNewFeatureIfNeeded();
      }
      else {
        ctx._map.featuresAt(e.point, {
          radius: 10,
          layer: [ 'gl-draw-polygon',
                   'gl-draw-line',
                   'gl-draw-point' ]
        }, (err, features) => {
          if (err) {
            throw err;
          }

          if (features.length
              && ctx._store.get(features[0].properties.drawId)
              && !ctx._store.get(features[0].properties.drawId).getOptions().permanent) {
                if(isShiftDown === false) {
                  ctx._handleDrawFinished();
                }
                return ctx._select(features[0].properties.drawId);
          }

          if(features.length === 0) {
            ctx._handleDrawFinished();
          }
        });
      }
    },
    onDoubleClick: function(e) {
      if (newFeature) {
        newFeature.onDoubleClick(e);
        ctx._store.renderSelected();
        cleanupNewFeatureIfNeeded();
      }
    },
    onKeyUp: function(e) {
      if (e.keyCode === SHIFT_KEY) {
        isShiftDown = false;
      }

      if (newFeature === null) {
        switch (e.keyCode) {
          case LINESTRING_KEY:
             return ctx._startDrawing('line');
          case MARKER_KEY:
            return ctx._startDrawing('point');
          case POLYGON_KEY:
            return ctx._startDrawing('polygon');
          case SQUARE_KEY:
            return ctx._startDrawing('square');
          case DELETE_KEY:
            return ctx._destroy();
          case DESELECT_KEY:
          case ENTER:
            return ctx._handleDrawFinished();
        }
      }
      else if((e.keyCode === DESELECT_KEY || e.keyCode === ENTER) && newFeature) {
        newFeature.onStopDrawing(e);
        cleanupNewFeatureIfNeeded();
      }
    },
    onKeyDown: function(e) {
      if (e.keyCode === SHIFT_KEY) {
        isShiftDown = true;
      }
    }
  };

  return api;
}
