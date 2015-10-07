for example in examples/*; do
  if [ -d $example ]; then
    browserify $example/index.js > $example/bundle.js;
    #cp dist/mapbox* $example;
    #cp -rf dist/font $example;
  fi
done;
