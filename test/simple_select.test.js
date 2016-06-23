/* eslint no-shadow:[0] */
import test from 'tape';
import mapboxgl from 'mapbox-gl-js-mock';
import GLDraw from '../';
import { click, accessToken, createMap, features } from './test_utils';
import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy
import stub from 'sinon/lib/sinon/stub'; // avoid babel-register-related error by importing only stub
import AfterNextRender from './utils/after_next_render';
import makeMouseEvent from './utils/make_mouse_event';



test('simple_select', t => {

  var map = createMap();
  spy(map, 'fire');

  var Draw = GLDraw();
  map.addControl(Draw);

  var afterNextRender = AfterNextRender(map);

  var cleanUp = function(cb) {
    Draw.deleteAll();
    map.fire.reset();
    afterNextRender(cb);
  }

  var getFireArgs = function() {
    var args = [];
    for (var i=0; i<map.fire.callCount; i++) {
      args.push(map.fire.getCall(i).args);
    }
    return args;
  }

  t.test('simple_select - setup', t => {
    var donedone = false;
    var done = function() {
      if (donedone === false) {
        t.pass('map loaded');
        t.end();
        donedone = true;
      }
    };
    if (map.loaded()) {
      done();
    }
    map.on('load', done);
  });


  t.test('simple_select box select', t => {
    Draw.add(features.negitivePoint);
    var id = Draw.add(features.point);
    map.fire.reset();

    afterNextRender(() => {
      map.fire('mousedown', makeMouseEvent(0, 0, true));
      map.fire('mousemove', makeMouseEvent(7, 7, true));
      map.fire('mousemove', makeMouseEvent(15, 15, true));
      map.fire('mouseup', makeMouseEvent(15, 15, true));

      afterNextRender(() => {
        var args = getFireArgs().filter(arg => arg[0] === 'draw.select');
        t.equal(args.length, 1, 'should have one and only one selected start event');
        if (args.length > 0) {
          t.equal(args[0][1].featureIds.length, 1, 'should select only one feautre');
          t.equal(args[0][1].featureIds[0], id, 'should select the feature we expect it to select');
        }
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - box select over 1001 points', t => {

    for(var i=0; i<1001; i++) {
      Draw.add(features.point);
    }
    map.fire.reset();

    afterNextRender(() => {
      map.fire('mousedown', makeMouseEvent(0, 0, true));
      map.fire('mousemove', makeMouseEvent(7, 7, true));
      map.fire('mousemove', makeMouseEvent(15, 15, true));
      map.fire('mouseup', makeMouseEvent(15, 15, true));

      afterNextRender(() => {
        t.equal(getFireArgs().filter(arg => arg[0] === 'draw.select').length, 0, 'there should be no draw.select event');
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - box select over no points', t => {

    Draw.add(features.point);
    map.fire.reset();

    afterNextRender(() => {
      map.fire('mousedown', makeMouseEvent(0, 0, true));
      map.fire('mousemove', makeMouseEvent(-7, -7, true));
      map.fire('mousemove', makeMouseEvent(-15, -15, true));
      map.fire('mouseup', makeMouseEvent(-15, -15, true));

      afterNextRender(() => {
        t.equal(getFireArgs().filter(arg => arg[0] === 'draw.select').length, 0, 'there should be no draw.select event');
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - unselect', t => {
    var id = Draw.add(features.point);
    Draw.changeMode('simple_select', [id]);
    map.fire.reset();

    afterNextRender(() => {
      map.fire('mousedown', makeMouseEvent(15, 15));
      map.fire('mouseup', makeMouseEvent(15, 15));

      afterNextRender(() => {
        var args = getFireArgs().filter(arg => arg[0] === 'draw.deselect');
        t.equal(args.length, 1, 'should have one and only one selected end event');
        if (args.length > 0) {
          t.equal(args[0][1].featureIds.length, 1, 'should unselect only one feautre');
          t.equal(args[0][1].featureIds[0], id, 'should unselect the feature we expect it to select');
        }
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - click on an unselected feature', t => {
    var id = Draw.add(features.polygon);
    Draw.changeMode('simple_select');

    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(50, 30));
      map.fire('mouseup', makeMouseEvent(50, 30));

      afterNextRender(() => {
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.select');
        t.equal(args.length, 1, 'should have one and only one selected start event');
        if (args.length > 0) {
          t.equal(args[0][1].featureIds.length, 1, 'should select only one feautre');
          t.equal(args[0][1].featureIds[0], id, 'should select the feature we expect it to select');
        }
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - click on an selected feature with shift down', t => {
    var id = Draw.add(features.polygon);
    Draw.changeMode('simple_select', [id]);

    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(50, 30, true));
      map.fire('mouseup', makeMouseEvent(50, 30, true));

      afterNextRender(() => {
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.deselect');
        t.equal(args.length, 1, 'should have one and only one selected end event');
        if (args.length > 0) {
          t.equal(args[0][1].featureIds.length, 1, 'should select only one feautre');
          t.equal(args[0][1].featureIds[0], id, 'should select the feature we expect it to select');
        }
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - delete selected features', t => {
    var id = Draw.add(features.polygon);
    Draw.changeMode('simple_select', [id]);
    map.fire.reset();
    Draw.trash();
    var args = getFireArgs();
    t.equal(args.length, 1, 'should have one and only one event');
    t.equal(args[0][0], 'draw.deleted');
    t.equal(args[0][1].featureIds.length, 1, 'should delete only one feautre');
    t.equal(args[0][1].featureIds[0].id, id, 'should delete the feature we expect it to delete');

    var selectedFeatures = Draw.getSelectedIds();
    t.equal(selectedFeatures.length, 0, 'nothing should be selected anymore');
    cleanUp(() => t.end());
  });

  t.test('simple_select - click on an selected feature with shift up to enter direct_select', t => {
    Draw.deleteAll();
    var id = Draw.add(features.polygon);
    Draw.changeMode('simple_select', [id]);

    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(50, 30, false));
      map.fire('mouseup', makeMouseEvent(50, 30, false));

      afterNextRender(() => {
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.modechange');
        t.equal(args.length, 1, 'should have one and only one selected end event');
        if (args.length > 0) {
          t.equal(args[0][1].mode, 'direct_select', 'should change to direct select');
          t.equal(args[0][1].opts.featureId, id, 'should work on the feature we expect')
        }
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - click on a vertex to enter direct_select', t => {
    var id = Draw.add(features.polygon);
    Draw.changeMode('simple_select', [id]);

    var clickPosition = features.polygon.geometry.coordinates[0][0];

    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(clickPosition[0], clickPosition[1]));
      map.fire('mouseup', makeMouseEvent(clickPosition[0], clickPosition[1]));

      afterNextRender(() => {
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.modechange');
        t.equal(args.length, 1, 'should have one and only one selected end event');
        if (args.length > 0) {
          t.equal(args[0][1].mode, 'direct_select', 'should change to direct select');
          t.equal(args[0][1].opts.featureId, id, 'should work on the feature we expect')
        }
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - click on an unselected feature with shift down while having another feature selected', t => {
    var pointId = Draw.add(features.point);
    var id = Draw.add(features.polygon);
    Draw.changeMode('simple_select', [pointId]);

    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(50, 30, true));
      map.fire('mouseup', makeMouseEvent(50, 30, true));

      afterNextRender(() => {
        t.equal(Draw.getSelectedIds().indexOf(pointId) != -1, true, 'point is still selected');
        t.equal(Draw.getSelectedIds().indexOf(id) != -1, true, 'polygon is now selected');
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.select');
        t.equal(args.length, 1, 'should have one and only one selected start event');
        if (args.length > 0) {
          t.equal(args[0][1].featureIds.length, 1, 'should select only one feautre');
          t.equal(args[0][1].featureIds[0], id, 'should select the feature we expect it to select');
        }
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - click on an unselected feature with shift up, while having another feature selected', t => {
    var pointId = Draw.add(features.point);
    var id = Draw.add(features.polygon);
    Draw.changeMode('simple_select', [pointId]);

    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(50, 30, false));
      map.fire('mouseup', makeMouseEvent(50, 30, false));

      afterNextRender(() => {
        t.equal(Draw.getSelectedIds().indexOf(pointId) === -1, true, 'point is no longer selected');
        t.equal(Draw.getSelectedIds().indexOf(id) != -1, true, 'polygon is now selected');
        var args = getFireArgs();
        args = args.filter(arg => arg[0] === 'draw.select');
        t.equal(args.length, 1, 'should have one and only one selected start event');
        if (args.length > 0) {
          t.equal(args[0][1].featureIds.length, 1, 'should select only one feautre');
          t.equal(args[0][1].featureIds[0], id, 'should select the feature we expect it to select');
        }
        cleanUp(() => t.end());
      });
    });
  });

  t.test('simple_select - drag a point', t => {
    var pointId = Draw.add(features.point);
    var multiPointId = Draw.add(features.multiPoint);
    var lineStringId = Draw.add(features.line);
    var multiLineStringId = Draw.add(features.multiLineString);
    var polygonId = Draw.add(features.polygon);
    var multiPolygonId = Draw.add(features.multiPolygon);

    var countPositions = function(feature) {
      return feature.geometry.coordinates.join(',').split(',').length;
    }

    var startPosition = features.point.geometry.coordinates;
    Draw.changeMode('simple_select', [pointId, multiPointId, lineStringId, multiLineStringId, polygonId, multiPolygonId]);
    afterNextRender(() => {
      map.fire.reset();
      map.fire('mousedown', makeMouseEvent(startPosition[0], startPosition[1]));
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 5, startPosition[1] + 5));
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 15, startPosition[1] + 15));
      map.fire('mousemove', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));
      map.fire('mouseup', makeMouseEvent(startPosition[0] + 25, startPosition[1] + 25));

      var movedPoint = Draw.get(pointId);
      t.equal(movedPoint.geometry.coordinates[0], startPosition[0] + 25, 'point lng moved');
      t.equal(movedPoint.geometry.coordinates[1], startPosition[1] + 25, 'point lat moved');
      t.equal(countPositions(movedPoint), countPositions(features.point), 'point has same number of postions');

      var movedMultiPoint = Draw.get(multiPointId);
      t.equal(movedMultiPoint.geometry.coordinates[0][0], features.multiPoint.geometry.coordinates[0][0] + 25, 'multipoint lng moved');
      t.equal(movedMultiPoint.geometry.coordinates[0][1], features.multiPoint.geometry.coordinates[0][1] + 25, 'multipoint lat moved');
      t.equal(countPositions(movedMultiPoint), countPositions(features.multiPoint), 'multiPoint has same number of postions');

      var movedLineString = Draw.get(lineStringId);
      t.equal(movedLineString.geometry.coordinates[0][0], features.line.geometry.coordinates[0][0] + 25, 'line lng moved');
      t.equal(movedLineString.geometry.coordinates[0][1], features.line.geometry.coordinates[0][1] + 25, 'line lat moved');
      t.equal(countPositions(movedLineString), countPositions(features.line), 'line has same number of postions');

      var movedMultiLineString =Draw.get(multiLineStringId);
      t.equal(movedMultiLineString.geometry.coordinates[0][0][0], features.multiLineString.geometry.coordinates[0][0][0] + 25, 'multiLineString lng moved');
      t.equal(movedMultiLineString.geometry.coordinates[0][0][1], features.multiLineString.geometry.coordinates[0][0][1] + 25, 'multiLineString lat moved');
      t.equal(countPositions(movedMultiLineString), countPositions(features.multiLineString), 'multiLineString has same number of postions');

      var movedPolygon =Draw.get(polygonId);
      t.equal(movedPolygon.geometry.coordinates[0][0][0], features.polygon.geometry.coordinates[0][0][0] + 25, 'polygon lng moved');
      t.equal(movedPolygon.geometry.coordinates[0][0][1], features.polygon.geometry.coordinates[0][0][1] + 25, 'polygon lat moved');
      t.equal(countPositions(movedPolygon), countPositions(features.polygon), 'polygon has same number of postions');

      var movedMultiPolygon =Draw.get(multiPolygonId);
      t.equal(movedMultiPolygon.geometry.coordinates[0][0][0][0], features.multiPolygon.geometry.coordinates[0][0][0][0] + 25, 'multiPolygon lng moved');
      t.equal(movedMultiPolygon.geometry.coordinates[0][0][0][1], features.multiPolygon.geometry.coordinates[0][0][0][1] + 25, 'multiPolygon lat moved');
      t.equal(countPositions(movedMultiPolygon), countPositions(features.multiPolygon), 'multiPolygon has same number of postions');

      t.end();
    });
  });

  t.end();
});

