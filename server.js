var express = require('express');
var app = express();
var browserify = require('browserify-middleware');


app.get('/mapbox-gl-draw.js', browserify('./index.js', {
    standalone: 'MapboxDraw',
    debug: true,
    cache: 'dynamic',
    minify: false
}));

app.get('/app.js', browserify('./debug/app.js', {
    standalone: 'MapboxDraw',
    debug: true,
    cache: 'dynamic',
    minify: false
}));

app.get('/mapbox-gl.js', function(req, res) {
  res.sendFile(__dirname+'/node_modules/mapbox-gl/dist/mapbox-gl.js');
});

app.get('/mapbox-gl.css', function(req, res) {
    res.sendFile(__dirname+ '/node_modules/mapbox-gl/dist/mapbox-gl.css');
});

app.get('/bench/index.js', browserify('./bench/index.js', {
    transform: ['unassertify', 'envify'],
    debug: true,
    minify: true,
    cache: 'dynamic'
}));

app.get('/bench/:name', function(req, res) {
    res.sendFile(__dirname + '/bench/index.html');
});

app.use('/debug', express.static(__dirname + '/debug'));
app.use('/dist', express.static(__dirname + '/dist'));


var port = process.env.PORT || 9967;

app.listen(port, function () {
    console.log('mapbox-gl-draw debug server running at http://localhost:' + port);
});
