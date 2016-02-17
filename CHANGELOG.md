## 0.3.5

Lets shift select work again

## 0.3.4

Fixes a bug where calling `Draw.add` on a `FeatureCollection` resulted in an error.

## 0.3.3

Fixes a bug where calling `Draw.deselect` in a `draw.delete` event handler would emit a `draw.set` event even though the feature had been removed fom Draw.

## 0.3.2

Fixes bug where `drawing: false` in the config would throw an error in the trash can control logic.

## 0.3.1

Expands support to [mapbox-gl@0.14.0](https://github.com/mapbox/mapbox-gl-js/releases/tag/v0.14.0)

## 0.3.0

#### Drawing changes

* When editing a feature, clicking on a node will delete it
* When creating a feature, escape ends drawing and deletes the features. No events are fired.
* When editing a feature, escape reverts changes to what the feature looked like when editing started

#### Bug fixes

* Fixed bug where the trash can would show up when zooming via the zoom box.
* Fixed bug where starting a new feature before finishing an old feature would save the old feature even if it was invalid

#### Api enhancements

* `startDrawing` lets you initiate drawing with your controls.
* The controls object now accepts `trash` letting you hide the trash control

## 0.2.4

Ships `dist/mapbox-gl-draw.js` to npm even though it is not committed.

## 0.2.3

#### Bug Fixes

* drawId was leaked to props in the minor bump, this was a mistake
* Features added via Draw.add had to be selected twice

## 0.2.2

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
