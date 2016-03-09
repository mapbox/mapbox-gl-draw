export default class Feature {
  constructor(ctx, geojson) {
    this.ctx = ctx;
    this.userProperties = geojson.properties;
    this.coordinates = geojson.geometry.coordinates;
    this.id = geojson.properties.id;
    this.type = geojson.geometry.type;

    this.drawProperties = {
      id: this.id,
      selected: false
    }
  }

  updateCoordinate(path, lon, lat) {
    var ids = path.split('.').map(x => parseInt(x, 10));
    var coordinate = this.coordinates[ids[0]];
    for(var i=1; i<ids.length; i++) {
      coordinate = coordinate[ids[i]];
    }
    coordinate[0] = lon;
    coordinate[1] = lat;
    this.ctx.store.render();
  }

  isSelected() {
    return this.drawProperties.selected;
  }

  select() {
    this.drawProperties.selected = true;
    this.ctx.store.render();
  }

  unselect() {
    this.drawProperties.selected = false;
    this.ctx.store.render();
  }

  update(geojson) {
    this.userProperties = geojson.properties;
    this.coordinates = geojson.geometry.coordinates;
    this.ctx.store.render();
  }

  toGeoJSON() {
    return JSON.parse(JSON.stringify({
      "id": this.id,
      "type": "Feature",
      "properties": this.userProperties,
      "geometry": {
        "coordinates": this.coordinates,
        "type": this.type
      }
    }));
  }

  forSource() {
    return null;
  }
}
