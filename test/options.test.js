/* eslint no-shadow:[0] */
import test from 'tape';
import MapboxDraw from '../';
import styleWithSourcesFixture from './fixtures/style_with_sources.json';

test('Options test', t => {
  t.test('no options', t => {
    const Draw = new MapboxDraw();
    const defaultOptions = {
      defaultMode: 'simple_select',
      keybindings: true,
      clickBuffer: 2,
      displayControlsDefault: true,
      boxSelect: true,
      userProperties: false,
      styles: Draw.options.styles,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true,
        combine_features: true,
        uncombine_features: true
      }
    };
    t.deepEquals(defaultOptions, Draw.options);
    t.deepEquals(styleWithSourcesFixture, Draw.options.styles);
    t.end();
  });

  t.test('use custom clickBuffer', t => {
    const Draw = new MapboxDraw({ clickBuffer: 10 });
    const defaultOptions = {
      defaultMode: 'simple_select',
      keybindings: true,
      clickBuffer: 10,
      boxSelect: true,
      displayControlsDefault: true,
      styles: Draw.options.styles,
      userProperties: false,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true,
        combine_features: true,
        uncombine_features: true
      }
    };

    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('hide all controls', t => {
    const Draw = new MapboxDraw({displayControlsDefault: false});
    const defaultOptions = {
      defaultMode: 'simple_select',
      keybindings: true,
      clickBuffer: 2,
      boxSelect: true,
      displayControlsDefault: false,
      userProperties: false,
      styles: Draw.options.styles,
      controls: {
        point: false,
        line_string: false,
        polygon: false,
        trash: false,
        combine_features: false,
        uncombine_features: false
      }
    };
    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('hide controls but show point', t => {
    const Draw = new MapboxDraw({displayControlsDefault: false, controls: {point:true}});
    const defaultOptions = {
      defaultMode: 'simple_select',
      keybindings: true,
      displayControlsDefault: false,
      clickBuffer: 2,
      boxSelect: true,
      userProperties: false,
      styles: Draw.options.styles,
      controls: {
        point: true,
        line_string: false,
        polygon: false,
        trash: false,
        combine_features: false,
        uncombine_features: false
      }
    };

    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('hide only point control', t => {
    const Draw = new MapboxDraw({ controls: {point:false}});
    const defaultOptions = {
      defaultMode: 'simple_select',
      keybindings: true,
      displayControlsDefault: true,
      clickBuffer: 2,
      userProperties: false,
      boxSelect: true,
      styles: Draw.options.styles,
      controls: {
        point: false,
        line_string: true,
        polygon: true,
        trash: true,
        combine_features: true,
        uncombine_features: true
      }
    };

    t.deepEquals(defaultOptions, Draw.options);
    t.end();
  });

  t.test('custom styles', t => {
    const Draw = new MapboxDraw({styles: [{
      'id': 'custom-polygon',
      'type': 'fill',
      'filter': ['all', ['==', '$type', 'Polygon']],
      'paint': {
        'fill-color': '#fff'
      }
    }, {
      'id': 'custom-point',
      'type': 'circle',
      'filter': ['all', ['==', '$type', 'Point']],
      'paint': {
        'circle-color': '#fff'
      }
    }]});

    const styles = [
      {
        'id': 'custom-polygon.cold',
        'source': 'mapbox-gl-draw-cold',
        'type': 'fill',
        'filter': ['all', ['==', '$type', 'Polygon']],
        'paint': {
          'fill-color': '#fff'
        }
      },
      {
        'id': 'custom-point.cold',
        'source': 'mapbox-gl-draw-cold',
        'type': 'circle',
        'filter': ['all', ['==', '$type', 'Point']],
        'paint': {
          'circle-color': '#fff'
        }
      },
      {
        'id': 'custom-polygon.hot',
        'source': 'mapbox-gl-draw-hot',
        'type': 'fill',
        'filter': ['all', ['==', '$type', 'Polygon']],
        'paint': {
          'fill-color': '#fff'
        }
      },
      {
        'id': 'custom-point.hot',
        'source': 'mapbox-gl-draw-hot',
        'type': 'circle',
        'filter': ['all', ['==', '$type', 'Point']],
        'paint': {
          'circle-color': '#fff'
        }
      }
    ];

    t.deepEquals(styles, Draw.options.styles);
    t.end();
  });

});
