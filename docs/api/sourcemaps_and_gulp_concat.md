
## Sourcemaps and `gulp-concat`

Because of the way `gulp-concat` handles file paths, you may need to set `cwd` and `path` manually on your `gulp-concat` instance to get everything to work correctly:

```js
var gulp = require('gulp');
var rev = require('gulp-rev');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');

gulp.task('default', function () {
	return gulp.src('src/*.js')
		.pipe(sourcemaps.init())
		.pipe(concat({path: 'bundle.js', cwd: ''}))
		.pipe(rev())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'));
```

##### [next: Streaming] (streaming.md)
