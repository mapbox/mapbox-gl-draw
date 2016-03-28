'use strict';

var Evented = require('../../node_modules/mapbox-gl/js/util/evented');
var util = require('../../node_modules/mapbox-gl/js/util/util');
var formatNumber = require('../lib/format_number');
var fpsRunner = require('../lib/fps');
var DrawMouse = require('../lib/mouse_draw');

var START = {x: 189, y: 293}

module.exports = function(options) {
    var evented = util.extend({}, Evented);

    var out = options.createMap({width:1024});

    var dragMouse = DrawMouse(START, out.map);

    var progressDiv = document.getElementById('progress');
    out.map.on('progress', function(e) {
      progressDiv.style.width = e.done+"%";
    });

    out.map.on('load', function() {
      out.draw.changeMode('draw_polygon');

      setTimeout(function() {
        var FPSControl = fpsRunner();
        FPSControl.start();
        dragMouse(function() {
          var fps = FPSControl.stop();
          if (fps < 55) {
            evented.fire('fail', {message: formatNumber(fps)+' fps - expected 55fps or better'});
          }
          else {
            evented.fire('pass', {message: formatNumber(fps)+' fps'});
          }
          out.draw.changeMode('simple_select');
        });
      }, 2000);
    });

    return evented;
};


