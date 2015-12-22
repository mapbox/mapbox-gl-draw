## 0.1.3

#### Breaking changes

* Renamed style theme for selected features. Was `gl-edit-{feature}`, now `gl-draw-selected-{feature}`.
* Renamed `Draw.set` method to `Draw.add`.
* Renamed `Draw.getEditing` method to `Draw.getSelected`.
* Renamed `draw.select` event to `draw.select`.
* Renamed `draw.deselect` event to `draw.deselect`.

#### API Improvements

* Added 4 selection methods: `Draw.select`, `Draw.selectAll`, `Draw.deselect`, and `Draw.deselectAll`.
