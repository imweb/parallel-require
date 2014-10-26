var through = require('through2');

module.exports = function () {
  return through.obj(function (file, enc, fn) {
    file.path = file.path.replace(/\.js$/, '.min.js');
    this.push(file);
    fn();
  });
}