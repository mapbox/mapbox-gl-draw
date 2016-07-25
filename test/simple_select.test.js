/* eslint no-shadow:[0] */
import test from 'tape';
import GLDraw from '../';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import AfterNextRender from './utils/after_next_render';
import makeMouseEvent from './utils/make_mouse_event';
import getGeoJSON from './utils/get_geojson';
import createMap from './utils/create_map';
import createSyntheticEvent from 'synthetic-dom-events';

test('simple_select', t => {

  var mapContainer = document.createElement('div');
  document.body.appendChild(mapContainer);
  var map = createMap({ container: mapContainer });
  spy(map, 'fire');
  spy(map.doubleClickZoom, 'enable');
  spy(map.doubleClickZoom, 'disable');
  spy(map.dragPan, 'enable');
  spy(map.dragPan, 'disable');

  var Draw = GLDraw();
  map.addControl(Draw);

  var afterNextRender = AfterNextRender(map);

  var cleanUp = function(cb) {
    Draw.deleteAll();
    map.fire.reset();
    if (cb) cb();
  };

  var getFireArgs = function() {
    var args = [];
    for (var i = 0; i < map.fire.callCount; i++) {
      args.push(map.fire.getCall(i).args);
    }
    return args;
  };

  t.test('simple_select - init map for tests', t => {
    var done = function() {
      map.off('load', done);
      t.end();
    };
    if (map.loaded()) {
      done();
    }
    else {
      map.on('load', done);
    }
  });


  t.test('simple_select - box select', t => {
    Draw.add(getGeoJSON('negativePoint'));
    var id = Draw.add(getGeoJSON('point'))[0];
    map.fire.reset();

    afterNextRender(() => {
      map.dragPan.enable.reset();
      map.dragPan.disable.reset();
      map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
      t.equal(map.dragPan.disable.callCount, 1, 'disable dragPan');
      map.fire('mousemove', makeMouseEvent(15, 15, {
        shiftKey: true,
        which: 1
      }));
      afterNextRender(() => {
        t.equal(map.getContainer().className.indexOf('mouse-add') > -1, true, 'mouse-add class has been set');
        map.fire('mouseup', makeMouseEvent(15, 15, { shiftKey: true }));

        afterNextRender(() => {
          t.equal(map.getContainer().className.indexOf('mouse-move') > -1, true, 'mouse-move class has been set');
          var args = getFireArgs().filter(arg => arg[0] === 'draw.selectionchange');
          t.equal(args.length, 1, 'should have one and only one selectionchange event');
          if (args.length > 0) {
            t.equal(args[0][1].features.length, 1, 'should have one feature selected');
            t.equal(args[0][1].features[0].id, id, 'should be the feature we expect to be selected');
          }
          cleanUp(t.end);
        });
      });
    });
  });

   t.test('simple_select - box select many features', t => {
    var features = [];
    for (var i = 0; i < 5; i++) {
      features.push(getGeoJSON('point'));
    }
    var ids = Draw.add({
      type: 'FeatureCollection',
      features: features
    });
    map.fire.reset();

    afterNextRender(() => {
      map.dragPan.enable.reset();
      map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
      map.fire('mousemove', makeMouseEvent(15, 15, {
        shiftKey: true,
        which: 1
      }));
      map.fire('mouseup', makeMouseEvent(15, 15, { shiftKey: true }));

      afterNextRender(() => {
        var args = getFireArgs().filter(arg => arg[0] === 'draw.selectionchange');
        t.equal(args.length, 1, 'should have one and only one select event');
        if (args.length > 0) {
          t.equal(args[0][1].features.length, ids.length, 'should have all features selected');
        }
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - box select over no points', t => {

    Draw.add(getGeoJSON('point'));
    map.fire.reset();

    afterNextRender(() => {
      map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
      map.fire('mousemove', makeMouseEvent(-15, -15, {
        shiftKey: true,
        which: 1
      }));
      map.fire('mouseup', makeMouseEvent(-15, -15, { shiftKey: true }));

      afterNextRender(() => {
        t.equal(getFireArgs().filter(arg => arg[0] === 'draw.selectionchange').length, 0, 'there should be no draw.selectionchange event');
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - box select then mousemove', t => {
    Draw.add(getGeoJSON('point'));
    map.fire.reset();

    afterNextRender(() => {
      map.fire('mousedown', makeMouseEvent(0, 0, { shiftKey: true }));
      map.fire('mousemove', makeMouseEvent(15, 15, { shiftKey: true }));
      // This mousemove (not a drag) cancels the box select
      map.fire('mousemove', makeMouseEvent(15, 15));
      map.fire('mouseup', makeMouseEvent(15, 15, { shiftKey: true }));

      afterNextRender(() => {
        t.equal(getFireArgs().filter(arg => arg[0] === 'draw.selectionchange').length, 0, 'there should be no draw.selectionchange event');
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - deselect', t => {
    var id = Draw.add(getGeoJSON('point'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });

    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(15, 15));
      map.fire('mouseup', makeMouseEvent(15, 15));

      afterNextRender(() => {
        var args = getFireArgs().filter(arg => arg[0] === 'draw.selectionchange');
        t.equal(args.length, 1, 'should have one and only one selectionchange event');
        if (args.length > 0) {
          t.equal(args[0][1].features.length, 0, 'should have no features selected');
        }
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - click on a deselected feature', t => {
    var id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select');

    afterNextRender(() => {
      map.fire.reset();
      map.doubleClickZoom.disable.reset();
      map.fire('mousedown', makeMouseEvent(50, 30));
      map.fire('mouseup', makeMouseEvent(50, 30));

      afterNextRender(() => {
        t.equal(map.doubleClickZoom.disable.callCount, 1, 'disable doubleClickZoom');
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.selectionchange');
        t.equal(args.length, 1, 'should have one and only one selectionchange event');
        if (args.length > 0) {
          t.equal(args[0][1].features.length, 1, 'should have only one feature selected');
          t.equal(args[0][1].features[0].id, id, 'should be the feature we expect to be selected');
        }
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - click on a selected feature with shift down', t => {
    var id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });

    afterNextRender(() => {
      map.fire.reset();
      map.doubleClickZoom.disable.reset();
      map.fire('mousedown', makeMouseEvent(50, 30, { shiftKey: true }));
      map.fire('mouseup', makeMouseEvent(50, 30, { shiftKey: true }));

      afterNextRender(() => {
        t.equal(map.doubleClickZoom.disable.callCount, 1, 'disable doubleClickZoom');
        t.equal(map.getContainer().className.indexOf('mouse-pointer') > -1, true, 'mouse-pointer class has been set');
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.selectionchange');
        t.equal(args.length, 1, 'should have one and only one selectionchange event');
        if (args.length > 0) {
          t.equal(args[0][1].features.length, 0, 'should have no features selected');
        }
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - delete selected features', t => {
    var id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });
    map.fire.reset();
    Draw.trash();
    afterNextRender(() => {
      var args = getFireArgs();
      args = args.filter(arg => arg[0] === 'draw.delete');
      t.equal(args.length, 1, 'should have one and only one draw.delete event');
      t.equal(args[0][1].features.length, 1, 'should delete only one feature');
      t.equal(args[0][1].features[0].id, id, 'should delete the feature we expect it to delete');

      var selectedFeatures = Draw.getSelectedIds();
      t.equal(selectedFeatures.length, 0, 'nothing should be selected anymore');
      cleanUp(t.end);
    });
  });

  t.test('simple_select - click on a selected feature with shift up to enter direct_select', t => {
    Draw.deleteAll();
    var id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });

    afterNextRender(() => {
      map.doubleClickZoom.enable.reset();
      map.fire.reset();
      map.doubleClickZoom.disable.reset();
      map.fire('mousedown', makeMouseEvent(50, 30, false));
      map.fire('mouseup', makeMouseEvent(50, 30, false));

      afterNextRender(() => {
        t.equal(map.doubleClickZoom.disable.callCount, 2, 'disable doubleClickZoom. Once for click, once for direct_select');
        t.equal(map.doubleClickZoom.enable.callCount, 1, 'double click zoom has been enabled');
        t.equal(map.getContainer().className.indexOf('mouse-move') > -1, true, 'mouse-move class has been set');
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.modechange');
        t.equal(args.length, 1, 'should have one and only one modechange event');
        if (args.length > 0) {
          t.equal(args[0][1].mode, 'direct_select', 'should change to direct select');
        }
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - click on a vertex to enter direct_select', t => {
    var id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [id] });

    var clickPosition = getGeoJSON('polygon').geometry.coordinates[0][0];

    afterNextRender(() => {
      map.doubleClickZoom.enable.reset();
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(clickPosition[0], clickPosition[1]));
      map.fire('mouseup', makeMouseEvent(clickPosition[0], clickPosition[1]));

      afterNextRender(() => {
        t.equal(map.doubleClickZoom.enable.callCount, 1, 'double click zoom has been enabled');
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.modechange');
        t.equal(args.length, 1, 'should have one and only one modechange event');
        if (args.length > 0) {
          t.equal(args[0][1].mode, 'direct_select', 'should change to direct select');
        }
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - click on a deselected feature with shift down while having another feature selected', t => {
    var pointId = Draw.add(getGeoJSON('point'))[0];
    var id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });

    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(50, 30, { shiftKey: true }));
      map.fire('mouseup', makeMouseEvent(50, 30, { shiftKey: true }));

      afterNextRender(() => {
        t.equal(map.getContainer().className.indexOf('mouse-move') > -1, true, 'mouse-move class has been set');
        t.equal(Draw.getSelectedIds().indexOf(pointId) !== -1, true, 'point is still selected');
        t.equal(Draw.getSelectedIds().indexOf(id) !== -1, true, 'polygon is now selected');
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.selectionchange');
        t.equal(args.length, 1, 'should have one and only one selectionchange event');
        if (args.length > 0) {
          t.equal(args[0][1].features.length, 2, 'should have two features selected');
          t.equal(args[0][1].features[0].id, pointId, 'selection includes point');
          t.equal(args[0][1].features[1].id, id, 'selection includes polygon');
        }
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - click on a deselected feature with shift up, while having another feature selected', t => {
    var pointId = Draw.add(getGeoJSON('point'))[0];
    var id = Draw.add(getGeoJSON('polygon'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });

    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(50, 30, false));
      map.fire('mouseup', makeMouseEvent(50, 30, false));

      afterNextRender(() => {
        t.equal(map.getContainer().className.indexOf('mouse-move') > -1, true, 'mouse-move class has been set');
        t.equal(Draw.getSelectedIds().indexOf(pointId) === -1, true, 'point is no longer selected');
        t.equal(Draw.getSelectedIds().indexOf(id) !== -1, true, 'polygon is now selected');
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.selectionchange');
        t.equal(args.length, 1, 'should have one and only one selectionchange event');
        if (args.length > 0) {
          t.equal(args[0][1].features.length, 1, 'should have only one feature selected');
          t.equal(args[0][1].features[0].id, id, 'should be the feature we expect to be selected');
        }
        cleanUp(t.end);
      });
    });
  });

  t.test('simple_select - drag every feature type', t => {
    var pointId = Draw.add(getGeoJSON('point'))[0];
    var multiPointId = Draw.add(getGeoJSON('multiPoint'))[0];
    var lineStringId = Draw.add(getGeoJSON('line'))[0];
    var multiLineStringId = Draw.add(getGeoJSON('multiLineString'))[0];
    var polygonId = Draw.add(getGeoJSON('polygon'))[0];
    var multiPolygonId = Draw.add(getGeoJSON('multiPolygon'))[0];

    var countPositions = function(feature) {
      return feature.geometry.coordinates.join(',').split(',').length;
    };

    var startPosition = getGeoJSON('point').geometry.coordinates;
    Draw.changeMode('simple_select', {
      featureIds: [pointId, multiPointId, lineStringId, multiLineStringId, polygonId, multiPolygonId]
    });
    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { which: 1 }));
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25, { which: 1 }));
      map.fire('mouseup', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));

      var movedPoint = Draw.get(pointId);
      t.equal(movedPoint.geometry.coordinates[0], startPosition[0] + 25, 'point lng moved');
      t.equal(movedPoint.geometry.coordinates[1], startPosition[1] + 25, 'point lat moved');
      t.equal(countPositions(movedPoint), countPositions(getGeoJSON('point')), 'point has same number of postions');

      var movedMultiPoint = Draw.get(multiPointId);
      t.equal(movedMultiPoint.geometry.coordinates[0][0], getGeoJSON('multiPoint').geometry.coordinates[0][0] + 25, 'multipoint lng moved');
      t.equal(movedMultiPoint.geometry.coordinates[0][1], getGeoJSON('multiPoint').geometry.coordinates[0][1] + 25, 'multipoint lat moved');
      t.equal(countPositions(movedMultiPoint), countPositions(getGeoJSON('multiPoint')), 'multiPoint has same number of postions');

      var movedLineString = Draw.get(lineStringId);
      t.equal(movedLineString.geometry.coordinates[0][0], getGeoJSON('line').geometry.coordinates[0][0] + 25, 'line lng moved');
      t.equal(movedLineString.geometry.coordinates[0][1], getGeoJSON('line').geometry.coordinates[0][1] + 25, 'line lat moved');
      t.equal(countPositions(movedLineString), countPositions(getGeoJSON('line')), 'line has same number of postions');

      var movedMultiLineString = Draw.get(multiLineStringId);
      t.equal(movedMultiLineString.geometry.coordinates[0][0][0], getGeoJSON('multiLineString').geometry.coordinates[0][0][0] + 25, 'multiLineString lng moved');
      t.equal(movedMultiLineString.geometry.coordinates[0][0][1], getGeoJSON('multiLineString').geometry.coordinates[0][0][1] + 25, 'multiLineString lat moved');
      t.equal(countPositions(movedMultiLineString), countPositions(getGeoJSON('multiLineString')), 'multiLineString has same number of postions');

      var movedPolygon = Draw.get(polygonId);
      t.equal(movedPolygon.geometry.coordinates[0][0][0], getGeoJSON('polygon').geometry.coordinates[0][0][0] + 25, 'polygon lng moved');
      t.equal(movedPolygon.geometry.coordinates[0][0][1], getGeoJSON('polygon').geometry.coordinates[0][0][1] + 25, 'polygon lat moved');
      t.equal(countPositions(movedPolygon), countPositions(getGeoJSON('polygon')), 'polygon has same number of postions');

      var movedMultiPolygon = Draw.get(multiPolygonId);
      t.equal(movedMultiPolygon.geometry.coordinates[0][0][0][0], getGeoJSON('multiPolygon').geometry.coordinates[0][0][0][0] + 25, 'multiPolygon lng moved');
      t.equal(movedMultiPolygon.geometry.coordinates[0][0][0][1], getGeoJSON('multiPolygon').geometry.coordinates[0][0][0][1] + 25, 'multiPolygon lat moved');
      t.equal(countPositions(movedMultiPolygon), countPositions(getGeoJSON('multiPolygon')), 'multiPolygon has same number of postions');

      t.end();
    });
  });

  t.test('simple_select - interrupt drag move with mousemove', t => {
    var pointId = Draw.add(getGeoJSON('point'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });
    var startPosition = getGeoJSON('point').geometry.coordinates;
    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
      // Dragging
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { which: 1 }));
      // Not dragging
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));
      map.fire('mouseup', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));

      var movedPoint = Draw.get(pointId);
      t.equal(movedPoint.geometry.coordinates[0], startPosition[0] + 15, 'point lng moved only the first amount');
      t.equal(movedPoint.geometry.coordinates[1], startPosition[1] + 15, 'point lat moved only the first amount');

      t.end();
    });
  });

  t.test('simple_select - fire one update when dragging mouse leaves container and button is released outside', t => {
    var pointId = Draw.add(getGeoJSON('point'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });
    var startPosition = getGeoJSON('point').geometry.coordinates;
    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { which: 1 }));
      mapContainer.dispatchEvent(createSyntheticEvent('mouseout'));
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));
      map.fire('mouseup', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));

      var movedPoint = Draw.get(pointId);
      var args = getFireArgs().filter(arg => arg[0] === 'draw.update');
      t.equal(args.length, 1, 'draw.update called once');
      t.equal(movedPoint.geometry.coordinates[0], startPosition[0] + 15, 'point lng moved only the first amount');
      t.equal(movedPoint.geometry.coordinates[1], startPosition[1] + 15, 'point lat moved only the first amount');

      t.end();
    });
  });

  t.test('simple_select - fire two update when dragging mouse leaves container then returns and button is released inside', t => {
    var pointId = Draw.add(getGeoJSON('point'))[0];
    Draw.changeMode('simple_select', { featureIds: [pointId] });
    var startPosition = getGeoJSON('point').geometry.coordinates;
    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15, { which: 1 }));
      mapContainer.dispatchEvent(createSyntheticEvent('mouseout'));
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25, { which: 1 }));
      map.fire('mouseup', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));

      var movedPoint = Draw.get(pointId);
      var args = getFireArgs().filter(arg => arg[0] === 'draw.update');
      t.equal(args.length, 2, 'draw.update called twice');
      t.equal(movedPoint.geometry.coordinates[0], startPosition[0] + 25, 'point lng moved to the mouseup location');
      t.equal(movedPoint.geometry.coordinates[1], startPosition[1] + 25, 'point lat moved to the mouseup location');

      t.end();
    });
  });

  document.body.removeChild(mapContainer);

  t.end();
});
