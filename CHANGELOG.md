## 0.2.0

#### Drawing Changes

* Square now acts as a macro for square polygons. Before a square feature had to always be a square feature while it was in side of draw, but could be edited outside.
* Square now works as a two click tool, dropping support for click-drag-release.
* draw.select.start and draw.select.end don't fire in the creation phase of a feature
* draw.set is only fired when the feature has been completed

#### Bug Fixes

* Default draw styles, conform to the [mapbox-gl-style-spec](https://www.mapbox.com/mapbox-gl-style-spec/)
* Points now appear pink when selected using the default style
* Clicking the trash can while creating a feature, concludes the drawing
* Users are able to drag the under lying map while drawing
* Works with mapbox-gl-js@0.13.1

## 0.1.7

#### Breaking changes

* Renamed `Draw.remove` to `Draw.destroy`

#### API Improvements

* `Draw.remove` now removes Mapbox-GL-Draw from your map

## 0.1.5

Fixes publish process so the distribution is kept up to date

## 0.1.4

Fixes bug with Draw.add that was making new features not render

## 0.1.3

#### Breaking changes

* Renamed style theme for selected features. Was `gl-edit-{feature}`, now `gl-draw-selected-{feature}`.
* Renamed `Draw.set` method to `Draw.add`.
* Renamed `Draw.getEditing` method to `Draw.getSelected`.
* Renamed `draw.select` event to `draw.select.start`.
* Renamed `draw.deselect` event to `draw.select.end`.

#### API Improvements

* Added 4 selection methods: `Draw.select`, `Draw.selectAll`, `Draw.deselect`, and `Draw.deselectAll`.
* Draw.add treats feature.id as its internal id so you can use external ids with Draw.get
