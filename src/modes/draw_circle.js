const CommonSelectors = require('../lib/common_selectors');
const Polygon = require('../feature_types/polygon');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const createVertex = require('../lib/create_vertex');

var createGeoJSONCircle = function(center, km, points = 128) {
   const coords = {
     latitude: center[1],
     longitude: center[0]
   };

   const ret = [];
   const distanceX = km / (110.574 * Math.cos(coords.latitude * Math.PI / 180));
   const distanceY = km / 110.574;

   let theta, x, y;
   for (var i = 0; i < points; i++) {
     theta = (i / points) * (2 * Math.PI);
     x = distanceX * Math.cos(theta);
     y = distanceY * Math.sin(theta);
     ret.push([
       coords.longitude + x,
       coords.latitude + y
     ]);
   }
   ret.push(ret[0]);
   return ret
};

function distance(lat1, lon1, lat2, lon2) {
	const radlat1 = Math.PI * lat1 / 180
	const radlat2 = Math.PI * lat2 / 180
	const theta = lon1 - lon2
	const radtheta = Math.PI * theta / 180
	let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180 / Math.PI
	dist = dist * 60 * 1.1515
  dist = dist * 1.609344
	return dist
}

module.exports = function(ctx) {

  const polygon = new Polygon(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POLYGON,
      coordinates: [[]]
    }
  });
  let currentVertexPosition = 0;

  if (ctx._test) ctx._test.polygon = polygon;

  ctx.store.add(polygon);

  return {
    start() {
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.POLYGON);
      this.on('mousemove', CommonSelectors.true, e => {
        if (currentVertexPosition === 0) return
        const coords = createGeoJSONCircle(polygon.center, distance(polygon.center[1], polygon.center[0], e.lngLat.lat, e.lngLat.lng))
        polygon.setCoordinates([coords])
        currentVertexPosition = coords.length
        if (CommonSelectors.isVertex(e)) {
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
        }
      });
      this.on('click', CommonSelectors.true, (e) => {
        if (currentVertexPosition > 0) {
          return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [polygon.id] });
        }
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });

        polygon.center = [e.lngLat.lng, e.lngLat.lat]
        const coords = createGeoJSONCircle([e.lngLat.lng, e.lngLat.lat], 100)
        polygon.setCoordinates([coords])
        currentVertexPosition = coords.length
      });
      this.on('click', CommonSelectors.isVertex, () => {
        return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [polygon.id] });
      });
      this.on('keyup', CommonSelectors.isEscapeKey, () => {
        ctx.store.delete([polygon.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('keyup', CommonSelectors.isEnterKey, () => {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [polygon.id] });
      });
      ctx.events.actionable({
        combineFeatures: false,
        uncombineFeatures: false,
        trash: true
      });
    },

    stop: function() {
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.NONE });
      doubleClickZoom.enable(ctx);
      ctx.ui.setActiveButton();

      // check to see if we've deleted this feature
      if (ctx.store.get(polygon.id) === undefined) return;

      //remove last added coordinate
      polygon.removeCoordinate(`0.${currentVertexPosition}`);
      if (polygon.isValid()) {
        ctx.map.fire(Constants.events.CREATE, {
          features: [polygon.toGeoJSON()]
        });
      }
      else {
        ctx.store.delete([polygon.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
      }
    },

    render(geojson, callback) {
      const isActivePolygon = geojson.properties.id === polygon.id;
      geojson.properties.active = (isActivePolygon) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
      if (!isActivePolygon) return callback(geojson);

      // Don't render a polygon until it has two positions
      // (and a 3rd which is just the first repeated)
      if (geojson.geometry.coordinates.length === 0) return;

      const coordinateCount = geojson.geometry.coordinates[0].length;

      // If we have fewer than two positions (plus the closer),
      // it's not yet a shape to render
      if (coordinateCount < 3) return;

      geojson.properties.meta = Constants.meta.FEATURE;

      if (coordinateCount > 4) {
        // Add a start position marker to the map, clicking on this will finish the feature
        // This should only be shown when we're in a valid spot
        callback(createVertex(polygon.id, geojson.geometry.coordinates[0][0], '0.0', false));
        let endPos = geojson.geometry.coordinates[0].length - 3;
        callback(createVertex(polygon.id, geojson.geometry.coordinates[0][endPos], `0.${endPos}`, false));
      }

      // If we have more than two positions (plus the closer),
      // render the Polygon
      if (coordinateCount > 3) {
        return callback(geojson);
      }

      // If we've only drawn two positions (plus the closer),
      // make a LineString instead of a Polygon
      const lineCoordinates = [
        [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]], [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]
      ];
      return callback({
        type: Constants.geojsonTypes.FEATURE,
        properties: geojson.properties,
        geometry: {
          coordinates: lineCoordinates,
          type: Constants.geojsonTypes.LINE_STRING
        }
      });
    },
    trash() {
      ctx.store.delete([polygon.id], { silent: true });
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  };
};
