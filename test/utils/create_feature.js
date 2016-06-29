import xtend from 'xtend';
import getGeoJSON from './get_geojson';
import hat from 'hat';

const hatRack = hat.rack();

export default function createFeature(featureType) {
  const feature = xtend({
    id: hatRack()
  }, getGeoJSON(featureType));
  feature.toGeoJSON = () => feature;
  return feature;
}
