var gulp = require('gulp')
  , uglify = require('gulp-uglify')
  , build = require('./tasks/build')
  , min = require('./tasks/min');

gulp.task('build', function (done) {
  gulp.src('src/loader.js')
    .pipe(build())
    .pipe(gulp.dest('dest'))
    .on('end', done);
});

gulp.task('default', ['build'], function () {
  gulp.src(['dest/*.js', '!dest/*.min.js'])
    .pipe(uglify())
    .pipe(min())
    .pipe(gulp.dest('dest'));
})