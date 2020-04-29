/* eslint no-shadow:[0] */
import test from "tape";
import MapboxDraw from '../';
import createMap from "./utils/create_map";
import spy from "sinon/lib/sinon/spy";

test("Layers insert test", (t) => {
  t.test("add map layer before insertBeforeLayerId", (t) => {
    const layerId = "test";
    const map = createMap();
    const addLayerSpy = spy(map, "addLayer");
    const opts = {
      insertBeforeLayerId: layerId
    };
    const Draw = new MapboxDraw(opts);
    map.addControl(Draw);

    t.equal(addLayerSpy.firstCall.lastArg, layerId, "should match layerId");
    t.end();
  });

  t.test("add map layer at the end", (t) => {
    const map = createMap();
    const addLayerSpy = spy(map, "addLayer");
    const opts = {};
    const Draw = new MapboxDraw(opts);
    map.addControl(Draw);

    t.equal(addLayerSpy.firstCall.lastArg, undefined, "should not be defined");
    t.end();
  });
});
