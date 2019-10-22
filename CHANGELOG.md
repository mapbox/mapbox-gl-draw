## Changelog

## 1.1.2

- update mapbox-gl peer dependency

## 1.1.1

- update mapbox-gl peer dependency

## 1.1.0

- add unminified build
- clear draw classes on remove (#785)
- don't run render on unused event handlers (#783)
- Remove overridden/dupe onMouseUp in SimpleSelect (#816)
- Include userProperties in Options section of docs (#817)
- change ordering of spy creation to avoid overwrites (#839)

## 1.0.9

- Fix a bug where GeoJSON features with numeric ids would not rerender correctly [#769](https://github.com/mapbox/mapbox-gl-draw/pull/769).

## 1.0.8

- Patch `map.fire` to support function signature changes in Mapbox GL JS 0.45.0 [#772](https://github.com/mapbox/mapbox-gl-draw/pull/772).

## 1.0.7

- Handle early control removal by canceling connect and checking for sources/layers [#685](https://github.com/mapbox/mapbox-gl-draw/pull/685) via [@gpbmike](https://github.com/gpbmike)
- Race condition loading shapes [#749](https://github.com/mapbox/mapbox-gl-draw/pull/749) via [nigelsim](https://github.com/nigelsim)

## 1.0.6

- Fixes bug where event.srcElement is not defined in Firefox  [#752](https://github.com/mapbox/mapbox-gl-draw/pull/752) via [@pastcompute](https://github.com/pastcompute)

## 1.0.5

- update browserify to version 15.0.0 [#731](https://github.com/mapbox/mapbox-gl-draw/pull/731)
- update babel-eslint to version 8.0.3 [#715](https://github.com/mapbox/mapbox-gl-draw/pull/715)
- update @turf/centroid to version 6.0.0 [#747](https://github.com/mapbox/mapbox-gl-draw/pull/747)

## 1.0.4

- Fixes bug where map interaction setting were oven written by Draw even after Draw was removed ([#696](https://github.com/mapbox/mapbox-gl-draw/pull/696) via @alexgleith)
- Updated readme to include `import` syntax (#706 via @thiagoxvo)

## 1.0.3

- Adds support for mapbox-gl@0.41.0 (#700 via @mike-marcacci)
- Uses `@mapbox`-namespaced packages for geojson-extent and point-geometry. (#700 via @mike-marcacci)
- Bump sinon@^4.0.0 and babelify@^8.0.0 versions

## 1.0.2

- Fixes double click when drawing a line or polygon crashing bug (#680 via @AliceR)
- Adds support for mapbox-gl@0.39.0
- Adds support for mapbox-gl@0.40.0

## 1.0.1

- Moves some of the doc files around which fixes a bug with webpack (#675)

## 1.0.0

- Adds [Custom Mode support](https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/MODES.md)
- Drops `static` mode, which can now be found [in its own repo](https://github.com/mapbox/mapbox-gl-draw-static-mode)
- Fixes bug where `MapboxDraw` would prevent `MapboxGeocoder` delete actions (#673)

## 0.19.1

- Fixes bug with safari where the map would move when drawing (#665).

## 0.19.0

- Improves mobile data support (thanks @z0d14c)
- Adds support for mapbox-gl@0.38.0

## 0.18.1

- Fixes bug with draw controls adding `false` to the tooltip when keybinding are turned off

## 0.18.0

- Add support for mapbox-gl@0.37.0
- Fix empty dist/mapbox-gl-draw.js file

## 0.17.4

- Fix bug where selected points that are moved would still return the same coordinates

## 0.17.0

- Adds support for continuing lines via `draw.changeMode`.

## 0.16.1

- Fixes bug where IE11 failed because it lacks `Array.find`.
- Adds support for mapbox-gl-js 0.29.x.
- Uses `@mapbox`-namespaced packages for dependencies.

## 0.16.0

#### ⚠️ Breaking changes ⚠️

- Changes `mapboxglDraw` to `MapboxDraw` to match other control names.
- Changes `MapboxDraw()` to `new MapboxDraw()` to match other control interfaces.
- Provides clearer icon support for drag feature in `direct_select`.

## 0.15.0

- Adds support for `mapbox-gl-js@0.28.0`.
- Adds `Draw.setFeatureProperty(string, string, any)`.
- Adds `mapboxglDraw({userProperties: boolean})` to add user properties to the data rendered by Draw.
- Fixes bug where Draw would fail to attach to mapbox-gl-js if added while a style was loading.
- Fixes bug where Firefox would treat all mousemove events as drag events.

## 0.14.0

#### ⚠️ Breaking changes ⚠️

- Requires [mapbox-gl@0.27.0](https://github.com/mapbox/mapbox-gl-js/blob/master/CHANGELOG.md#0270-november-11-2016).
- Detects style changes and reapplies Draw if it has been removed.
- Fixes UMD support.
- Changes `mapboxgl.Draw` to `mapboxglDraw` when in global scope.

## 0.13.2

- Removes deprecated `interactive` property from styles.

## 0.13.1

- Fixes a when where `draw.actionable` would fail to fire on `trash` if there were no features left.
- Fixes a bug where `trash` moves Draw from `direct_select` to `simple_select`.

## 0.13.0

- Adds `draw.actionable` as a way to track if `Draw.trash`, `Draw.combineFeatures` and `Draw.uncombineFeatuers` are actionable.

## 0.12.2

- Add support for mapbox-gl-js 0.26.x

## 0.12.1

- Fix bug that broke editing MultiFeatures in `direct_select` mode after using the combine feature

## 0.12.0

- Adds support for combining features into multi-features
- Adds support for uncombing multi-fetaures into features

## 0.11.21

- Upgrade mapbox-gl dependency

## 0.11.20

- Fix bug causing problems when selecting features at tile intersections.

## 0.11.19

- Fix bug with MultiLineString

## 0.11.18

- Upgrade mapbox-gl dependency

## 0.11.17

- Fix geojsonhint error filtering.

## 0.11.12

- Use geojsonhint version 2.0.0beta

## 0.11.12

- Fix bug causing render update with firing `draw.update` event when mouse leaves map container.

## 0.11.11

- Fix bug caused by `render` calling itself synchronously, side-stepping the throttle and possibly emitting the same deleted features twice.

## 0.11.10

- Add support for mapbox-gl 0.21

## 0.10.0

- Add `draw.select` and `draw.deselect`, replacing `draw.mode.simple_select.selected.*` events.
- Add `Draw.getSelectedIds()`.

## 0.9.2

- Fixes bug with `draw.modified` and point creation
- Prevents `draw.modifed` from emitting deleted features

## 0.9.1

- Fix bug causing deleted features to not always be deselected.

## ...

## 0.7.2

- Update default theme

## 0.7.1

- Waits for mouse events until the map has loaded
- Emits all changes to feautres all valid

## 0.7.0

* Draw now supports MultiPoint, MultiLineString and MultiPolygon geojson feature types.

## 0.6.7

* Allow use of mapbox-gl@0.19

## 0.6.6

* Fix mouse cursors when Draw is created before the map is available
* Fix Draw.add when adding a feature that already exhists

## 0.6.5

* Ensure keybindings option is enforced

## 0.6.4

* Major speed improvement while drawing
* Removes displaying polygons and lines as points when they are very small

## 0.6.0

* Draw.add now runs geojsonhint on provided features to confirm they are valid geojson
* Draw.add now doesn't add any features to the map if one provided has an error
* It used to be possible to trick Draw into thinking you were dragging when you meant to be clicking. This also helps not move the map while clicking rather than dragging.
* Moved to size bassed selection. This means the smallest feature is selected first. Points, than LineStrings, than Polygons where polygons are selected in order of their area.

## 0.6.0-rc9

* Upgrade to mapbox-gl-js-mock v0.18

## 0.6.0-rc8

* Upgrade to Mapbox GL JS v0.18

## 0.6.0-rc7

* When moving from a drawing mode to simple select, select the new feature

## 0.6.0-rc6

* Fix custom styling
* Draw.add now updates the stored properties of a feature
* Draw no longer emits features that are invalid as changed

## 0.6.0-rc5

* polygons and lines that are too small to see now show up as points

## 0.6.0-rc4

Upgrade to Mapbox GL JS v0.17

## 0.6.0-rc3

Cursors can now be set via css classes. Default cursor options have been added. This restores the long standing issue of hover cursors not working.

Moving from simple_select to direct_select can now be done by selecting a vertex in simple_select mode.

Bug fix for control position options thanks to @nsamala.

## 0.6.0-rc2

Fresh new style. Better selection ability for lines. Double click to end drawing a line.

`draw.changed` has been updated to emit an object `{features: []}` and to only emit when something has changed and is in a valid state.

## 0.6.0-rc1

This is a preview release of the work being done in the [0.6.0](https://github.com/mapbox/mapbox-gl-draw/milestones/0.6.0) milestone.

We are skipping 0.5.0 as this change is very large and breaks much of the Draw API functionality.

To preview this release please take a look API.md to get started. Feedback is very welcome and is generally [being collected here](https://github.com/mapbox/mapbox-gl-draw/issues/264).

## 0.4.0

* Name space css. If you are not using the provided CSS, update your own css to match the new naming schemes.
* displayControlsDefault lets a you change the default option for displaying controls from true to false
* fixed bug where `update` didn't render changes
* fixed bug where drag events that shouldn't drag the map still would due to a featuresAt race condition

## 0.3.6

* Performance improvements
* Supports mapbox-gl@0.15.0
* Cleans up event listeners on Draw.remove

## 0.3.5

Lets shift select work again

## 0.3.4

Fixes a bug where calling `Draw.add` on a `FeatureCollection` resulted in an error.

## 0.3.3

Fixes a bug where calling `Draw.deselect` in a `draw.delete` event handler would emit a `draw.set` event even though the feature had been removed from Draw.

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

#### API enhancements

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
