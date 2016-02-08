import R from 'ramda';
import { DOM } from './util';

const ENTER = 13;          // (enter)
const SHIFT_KEY = 16;      // (shift)
const SQUARE_KEY = 83;     // (s)
const MARKER_KEY = 77;     // (m)
const POLYGON_KEY = 80;    // (p)
const ESCAPE_KEY = 27;  // (esc)
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
      else if (newFeature.toRemove) {
        ctx._destroy();
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
        ctx._store._render();
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
              activeVertex = R.find(feat => feat.properties.meta === 'vertex')(features) || null;

              if(tempVertex && activeVertex === null) {
                ctx._store.get(tempVertex.properties.parent)
                  .addVertex([tempVertex.properties.lng, tempVertex.properties.lat], tempVertex.properties.index);
                activeVertex = tempVertex;
                ctx._store._render();
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
        ctx._store._render();
        cleanupNewFeatureIfNeeded();
      }
      else {

        if(isShiftDown && activeVertex === null && activeDrawId === null) {
          var end = DOM.mousePos(e, ctx._map.getContainer());
          ctx._store.selectFeaturesIn(dragStartPoint, end);
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
        ctx._store._render();
        cleanupNewFeatureIfNeeded();
      }
    },
    onMouseDrag: function(e) {
      var curr = DOM.mousePos(e.originalEvent, ctx._map.getContainer());
      if (activeVertex) {
        e.originalEvent.stopPropagation();
        ctx._store.get(activeVertex.properties.parent)
          .moveVertex(dragStartPoint, curr, activeVertex.properties.index);
        ctx._store._render();
      }
      else if (activeDrawId) {
        e.originalEvent.stopPropagation();
        ctx._store.get(activeDrawId).translate(dragStartPoint, curr);
        ctx._store._render();
      }
    },
    onClick: function(e) {
      if (newFeature) {
        newFeature.onClick(e);
        ctx._store._render();
        cleanupNewFeatureIfNeeded();
      }
      else {
        ctx._map.featuresAt(e.point, {
          radius: 10,
          layer: [ 'gl-draw-polygon', 'gl-draw-line', 'gl-draw-point',
          'gl-draw-selected-polygon', 'gl-draw-selected-line', 'gl-draw-selected-point' ]
        }, (err, results) => {
          if (err) {
            throw err;
          }

          var features = [];
          var vertices = [];

          results.forEach(result => {
            var featureId = result.properties.drawId || result.properties.parent;
            var feature = ctx._store.get(featureId);

            if (feature && result.properties.meta === 'vertex') {
              vertices.push([feature, result.properties.index]);
            }
            else if (feature
              && result.properties.drawId
              && feature.getOptions().permanent !== true
              && !feature.selected) {
              features.push(feature);
            }
          });

          if(features.length > 0) {
            if(isShiftDown === false) {
              ctx._handleDrawFinished();
            }
            ctx.select(features[0].drawId);
          }
          else if(vertices.length > 0) {
            if (vertices[0][0].removeVertex(vertices[0][1])) {
              ctx._store.delete(vertices[0][0].drawId);
            }
            ctx._store._render();
          }
          else {
            ctx._handleDrawFinished();
          }
        });
      }
    },
    onDoubleClick: function(e) {
      if (newFeature) {
        newFeature.onDoubleClick(e);
        ctx._store._render();
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
            ctx._startDrawing('line');
            break;
          case MARKER_KEY:
            ctx._startDrawing('point');
            break;
          case POLYGON_KEY:
            ctx._startDrawing('polygon');
            break;
          case SQUARE_KEY:
            ctx._startDrawing('square');
            break;
          case ESCAPE_KEY:
            ctx._store.revertSelected();
            e.preventDefault();
            break;
          case ENTER:
            ctx._handleDrawFinished();
            break;
        }
      }
      else {
        switch(e.keyCode) {
          case ENTER:
            newFeature.onStopDrawing(e);
            cleanupNewFeatureIfNeeded();
            break;
          case ESCAPE_KEY:
            newFeature.toRemove = true;
            ctx._destroy();
            newFeature = null;
            break;
        }
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
