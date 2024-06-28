import hat from 'hat';
import getGeoJSON from './get_geojson.js';

const hatRack = hat.rack();

export default function createFeature(featureType) {
  const feature = Object.assign({
    id: hatRack(),
    properties: {}
  }, getGeoJSON(featureType));
  feature.toGeoJSON = () => feature;
  feature.setProperty = (property, name) => { feature.properties[property] = name; };
  return feature;
}
