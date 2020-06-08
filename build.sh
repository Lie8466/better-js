rm -rf test/build/main.js
webpack --mode=production
cp dist/main.js test/public/