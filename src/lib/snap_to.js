const StringSet = require('../lib/string_set');
const coordEach = require('@turf/meta').coordEach;
const cheapRuler = require('cheap-ruler');
const xtend = require('xtend');

function addSnapOverSources(styles, sources) {
  let snapStyles = [];
  sources.forEach((source) => {
    snapStyles = snapStyles.concat(styles.map(style => {
      if (style.source) return style;
      return xtend(style, {
        id: `${style.id}.${source}`,
        source: `${source}`,
        'source-layer': `${source}`
      });
    }));
  });
  return snapStyles;
}

function findCoords(feature, ruler, eventCoords) {
  let type = feature.geometry.type;

  //change a polygon to a linestring
  if (type === "Polygon") {
    feature.geometry.coordinates = feature.geometry.coordinates[0];
    feature.geometry.type = "LineString";
    type = feature.geometry.type;
  }

  if (type === "LineString") {
    const result = ruler.pointOnLine(feature.geometry.coordinates, eventCoords);

    return { coords: result.point, type: 'line', nearest: feature.geometry.coordinates[result.index] };
  } else if (type === "Point") {
    return { coords: feature.geometry.coordinates, type: 'point' };
  }
  return undefined;
}

function removeStyling(ctx) {
  ctx.options.snapOver.forEach(style => {
    if (ctx.map.getLayer(style.id) !== undefined) {
      ctx.map.removeLayer(style.id);
    }
  });
}


// All are required
module.exports = function snapTo(evt, ctx, id, snapOverSources) {
  if (ctx.map === null) return [];

  if (ctx.snapToOverride) {
    removeStyling(ctx);
    return evt;
  }

  const buffer = ctx.options.snapBuffer;
  const box = [
    [evt.point.x - buffer, evt.point.y - buffer],
    [evt.point.x + buffer, evt.point.y + buffer]
  ];

  const featureIds = new StringSet();
  const uniqueFeatures = [];
  const evtCoords = (evt.lngLat.toArray !== undefined) ? evt.lngLat.toArray() : undefined;
  const snapFilterOff = ['all', ["==", "id", ""]];
  let closest = {feature: null, coord: null, distance: null};

  if (JSON.stringify(ctx.options.snapOverSources) !== JSON.stringify(snapOverSources)) {
    removeStyling(ctx);
    ctx.options.snapOver = addSnapOverSources(ctx.options.snapOverStyles, ctx.options.snapOverSources);
  }

  ctx.options.snapOver.forEach(style => {
    if (ctx.map.getLayer(style.id) === undefined) {
      ctx.map.addLayer(style);
    }
  });

  ctx.map.queryRenderedFeatures(box, { layers: ctx.options.snapStyles })
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
    ctx.options.snapOver.forEach(style => {
      if (ctx.map.getLayer(style.id) !== undefined) {
        ctx.map.setFilter(style.id, snapFilterOff);
      }
    });
    return evt;
  }

  //snapto line
  uniqueFeatures.forEach((feature) => {
    const type = feature.geometry.type;
    let result;

    //z is max map zoom of 20
    const ruler = cheapRuler.fromTile(feature._vectorTileFeature._y, 20);

    if (type.search("Multi") !== -1) {
      //currently not doing Multi anything, only simple features
    } else {
      result = findCoords(feature, ruler, evtCoords);
    }

    if (result !== undefined) {
      const dist = ruler.distance(result.coords, evtCoords);

      if ((dist !== null) && (closest.distance === null || dist < closest.distance)) {
        feature.distance = dist;
        closest = {feature: feature, coord: result.coords, distance: dist};
      }
    }
  });

  //vertex snapping, check if coord is with bounding box
  coordEach(closest.feature, (coord) => {
    if (closest.feature.geometry.type === "Point") return;
    const pnt =  ctx.map.project(coord);

    if (pnt.x > box[0][0] && pnt.x < box[1][0] && pnt.y > box[0][1] && pnt.y < box[1][1]) {
      //snap to point
      closest.coord = coord;
    }
  });

  if (closest.distance !== null) {
    evt.lngLat.lng = closest.coord[0];
    evt.lngLat.lat = closest.coord[1];
    evt.point = ctx.map.project(closest.coord);

    const circleFilterOn = ['all',
      ['any', ["==", "$type", "LineString"], ['==', '$type', 'Polygon'], ['==', '$type', 'Point']],
      ["==", "id", closest.feature.properties.id]
    ];
    const lineFilterOn = ['all',
      ['any', ["==", "$type", "LineString"], ['==', '$type', 'Polygon']],
      ["==", "id", closest.feature.properties.id]
    ];

    //add hover style
    ctx.options.snapOver.forEach(style => {
      if (style.type === 'circle') {
        ctx.map.setFilter(style.id, circleFilterOn);
      } else if (style.type === 'line') {
        ctx.map.setFilter(style.id, lineFilterOn);
      }
    });
  }
  return evt;
};
