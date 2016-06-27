import getGeoJSON from './get_geojson';
import hat from 'hat';

const hatRack = hat.rack();

export default function createFeature(featureType) {
  const feature = Object.assign({
    id: hatRack()
  }, getGeoJSON(featureType));
  feature.toGeoJSON = () => feature;
  return feature;
}
