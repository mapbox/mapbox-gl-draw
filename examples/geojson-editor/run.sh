#!/usr/bin/env bash

budo index.js --serve=bundle.js --live -d | bistre & open http://10.0.0.13:9967/
