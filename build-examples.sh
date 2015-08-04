for example in examples/*; do
  if [ -d examples/$example ]; then
    browserify examples/$example/index.js > examples/$example/bundle.js;
  fi
done;
