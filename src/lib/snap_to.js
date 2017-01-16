const StringSet = require('../lib/string_set');
const coordEach = require('@turf/meta').coordEach;
const point = require('turf-point');
const pointOnLine  = require('@turf/point-on-line');
const distance = require('@turf/distance');


// All are required
module.exports = function snapTo(evt, buffer, ctx, id) {
  if (ctx.map === null) return [];

  const box = [
    [evt.point.x - buffer, evt.point.y - buffer],
    [evt.point.x + buffer, evt.point.y + buffer]
  ];

  const snapOverCircleStyleId = ctx.options.snapOverCircleStyle.id;
  const snapOverLineStyleId = ctx.options.snapOverLineStyle.id;

  const featureIds = new StringSet();
  const uniqueFeatures = [];
  const evtCoords = (evt.lngLat.toArray !== undefined) ? evt.lngLat.toArray() : undefined;

  let closestDistance = null;
  let closestCoord;
  let closestFeature;

  const snapStyles = ctx.options.snapStyles;
  const snapFilterOff = ['all', ["==", "id", ""]];

  if (ctx.map.getLayer(snapOverLineStyleId) === undefined) {
    ctx.map.addLayer(ctx.options.snapOverLineStyle);
  }
  if (ctx.map.getLayer(snapOverCircleStyleId) === undefined) {
    ctx.map.addLayer(ctx.options.snapOverCircleStyle);
  }

  ctx.map.queryRenderedFeatures(box, { layers: snapStyles })
    .forEach((feature) => {
      const featureId = feature.properties.id;

      if (featureIds.has(featureId) || String(featureId) === id) {
        return;
      }
      featureIds.add(featureId);
      return uniqueFeatures.push(feature);
    });

  if (evtCoords === undefined || uniqueFeatures.length < 1) {
    //remove hover style
    if (ctx.map.getLayer(snapOverCircleStyleId) !== undefined) {
      ctx.map.setFilter(snapOverCircleStyleId, snapFilterOff);
    }
    if (ctx.map.getLayer(snapOverLineStyleId) !== undefined) {
      ctx.map.setFilter(snapOverLineStyleId, snapFilterOff);
    }
    return evt;
  }

  //snapto line
  uniqueFeatures.forEach((feature) => {
    let type = feature.geometry.type,
      snappedPt, dist, coords;

    //change a polygon to a linestring
    if (type === "Polygon") {
      feature.geometry.coordinates = feature.geometry.coordinates[0];
      feature.geometry.type = "LineString";
      type = feature.geometry.type;
    }

    if (type === "LineString") {
      snappedPt = pointOnLine(feature, point(evtCoords), "degrees");
      dist = snappedPt.properties.dist;
      coords = snappedPt.geometry.coordinates;
    } else {
      //should be a point
      dist = distance(feature, point(evtCoords), "degrees");
      coords = feature.geometry.coordinates;
    }

    if (closestDistance === null || dist < closestDistance) {
      feature.distance = dist;
      closestFeature = feature;
      closestCoord = coords;
      closestDistance = dist;
    }
  });

  //vertex snapping, check if coord is with bounding box
  coordEach(closestFeature, (coord) => {
    if (closestFeature.geometry.type === "Point") return;
    const pnt =  ctx.map.project(coord);

    if (pnt.x > box[0][0] && pnt.x < box[1][0] && pnt.y > box[0][1] && pnt.y < box[1][1]) {
      //snap to point
      closestCoord = coord;
    }
  });

  if (closestDistance !== null) {
    evt.lngLat.lng = closestCoord[0];
    evt.lngLat.lat = closestCoord[1];
    evt.point = ctx.map.project(closestCoord);

    const circleFilterOn = ['all',
      ['any', ["==", "$type", "LineString"], ['==', '$type', 'Polygon'], ['==', '$type', 'Point']],
      ["==", "id", closestFeature.properties.id]
    ];
    const lineFilterOn = ['all',
      ['any', ["==", "$type", "LineString"], ['==', '$type', 'Polygon']],
      ["==", "id", closestFeature.properties.id]
    ];

    //add hover style
    ctx.map.setFilter(snapOverLineStyleId, lineFilterOn);
    ctx.map.setFilter(snapOverCircleStyleId, circleFilterOn);
  }
  return evt;
};
