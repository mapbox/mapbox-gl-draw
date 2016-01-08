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
