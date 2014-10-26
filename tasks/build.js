var through = require('through2')
  , fs = require('fs')
  , path = require('path')
  , File = require('vinyl')
  , STORAGE_PATH = './src/storage';

module.exports = function () {
  return through.obj(function (file, enc, fn) {
    var contents = file.contents.toString()
      , cwd = file.cwd
      , base = file.base
      , fp = file.path
      , self = this;
    fs.readdirSync(STORAGE_PATH)
      .filter(function (item) { return /\.js$/.test(item); })
      .forEach(function (item) {
        var p = path.join(STORAGE_PATH, item)
          , file = new File({
            cwd: cwd,
            base: base,
            path: fp.replace(/\.js$/, '-' + item),
            contents: new Buffer(contents.replace("import('storage');", fs.readFileSync(p)))
          });
        self.push(file);
      });
    fn();
  });
}