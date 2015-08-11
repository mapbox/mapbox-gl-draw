for example in examples/*; do
  if [ -d $example ]; then
    browserify $example/index.js > $example/bundle.js;
  fi
done;
