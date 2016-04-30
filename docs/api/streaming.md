## Streaming

This plugin does not support streaming. If you have files from a streaming source, such as browserify, you should use [gulp-buffer](https://github.com/jeromew/gulp-buffer) before `gulp-rev` in your pipeline:

```js
var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('gulp-buffer');
var rev = require('gulp-rev');

gulp.task('default', function () {
	return browserify('src/index.js')
		.bundle({debug: true})
		.pipe(source('index.min.js'))
		.pipe(buffer())
		.pipe(rev())
		.pipe(gulp.dest('dist'))
});
```

##### [next: Integration] (integration.md)
