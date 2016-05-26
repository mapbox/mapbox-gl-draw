'use strict';
var util = require('../node_modules/mapbox-gl/js/util/util');

try {
    main();
} catch (err) {
    log('red', err.toString());
    throw err;
}

function main() {

    var benchmarks = {
        simple_select_small: require('./tests/simple_select_small'),
        simple_select_large: require('./tests/simple_select_large'),
        simple_select_large_two_maps: require('./tests/simple_select_large_two_maps'),
        simple_select_large_zoomed: require('./tests/simple_select_large_zoomed'),

        direct_select_small: require('./tests/direct_select_small'),
        direct_select_small_zoomed: require('./tests/direct_select_small_zoomed'),
        direct_select_large: require('./tests/direct_select_large'),
        direct_select_large_zoomed: require('./tests/direct_select_large_zoomed'),

        draw_line_string_small: require('./tests/draw_line_string_small'),
        draw_line_string_large: require('./tests/draw_line_string_large'),
        draw_line_string_large_zoomed: require('./tests/draw_line_string_large_zoomed'),

        draw_polygon_small: require('./tests/draw_polygon_small'),
        draw_polygon_large: require('./tests/draw_polygon_large'),
        draw_polygon_large_zoomed: require('./tests/draw_polygon_large_zoomed'),

        draw_land_polygon_small: require('./tests/draw_land_polygon_small'),
        draw_land_polygon_large: require('./tests/draw_land_polygon_large'),

        draw_urban_areas_polygon_small: require('./tests/draw_urban_areas_polygon_small'),
        draw_urban_areas_polygon_large: require('./tests/draw_urban_areas_polygon_large'),

        draw_point_small: require('./tests/draw_point_small'),
        draw_point_large: require('./tests/draw_point_large'),
        draw_point_large_zoomed: require('./tests/draw_point_large_zoomed'),
    };

    var pathnameArray = location.pathname.split('/');
    var benchmarkName = pathnameArray[pathnameArray.length - 1] || pathnameArray[pathnameArray.length - 2];

    var testDiv = document.getElementById('tests');
    var tests = Object.keys(benchmarks);

    var innerHTML = '';

    tests.forEach(function(test) {
        innerHTML += '<div class="test">';
            innerHTML += '<a href="/bench/'+test+'">'+test+'</a>';
        innerHTML += '</div>';
        if (test === benchmarkName) {
            innerHTML += '<div id="logs"></div>';
        }
    });

    testDiv.innerHTML = innerHTML;

    log('dark', 'please keep this window in the foreground and close the debugger');

    var createBenchmark = benchmarks[benchmarkName];
    if (!createBenchmark) {
        log('dark', benchmarkName+' is not a valid test name');
        return;
    }

    var benchmark = createBenchmark({
        accessToken: getAccessToken(),
        createMap: createMap
    });

    benchmark.on('log', function(event) {
        log(event.color || 'blue', event.message);
    });

    benchmark.on('pass', function(event) {
        log('green', '<strong class="prose-big">' + event.message + '</strong>');
    });

    benchmark.on('fail', function(event) {
        log('red', '<strong class="prose-big">' + event.message + '</strong>');
    });
}

function log(color, message) {
    document.getElementById('logs').innerHTML += '<div class="log dark fill-' + color + '"><p>' + message + '</p></div>';
}

function getAccessToken() {
    var accessToken = (
        process.env.MapboxAccessToken ||
        process.env.MAPBOX_ACCESS_TOKEN ||
        getURLParameter('access_token') ||
        localStorage.getItem('accessToken')
    );
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
}

function getURLParameter(name) {
    var regexp = new RegExp('[?&]' + name + '=([^&#]*)', 'i');
    var output = regexp.exec(window.location.href);
    return output && output[1];
}

function createMap(options) {
    var mapElement = document.getElementById('map');

    options = util.extend({width: 512, height: 512}, options);

    mapElement.style.display = 'block';
    mapElement.style.width = options.width + 'px';
    mapElement.style.height = options.height + 'px';

    mapboxgl.accessToken = getAccessToken();
    var map = new mapboxgl.Map(util.extend({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v8'
    }, options));

    var draw = mapboxgl.Draw(options);

    map.addControl(draw);

    return {
        draw: draw,
        map: map
    }
}
