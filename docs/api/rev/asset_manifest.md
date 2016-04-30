### Asset manifest

```js
var gulp = require('gulp');
var rev = require('gulp-rev');

gulp.task('default', function () {
	// by default, gulp would pick `assets/css` as the base,
	// so we need to set it explicitly:
	return gulp.src(['assets/css/*.css', 'assets/js/*.js'], {base: 'assets'})
		.pipe(gulp.dest('build/assets'))  // copy original assets to build dir
		.pipe(rev())
		.pipe(gulp.dest('build/assets'))  // write rev'd assets to build dir
		.pipe(rev.manifest())
		.pipe(gulp.dest('build/assets')); // write manifest to build dir
});
```

An asset manifest, mapping the original paths to the revisioned paths, will be written to `build/assets/rev-manifest.json`:

```json
{
	"css/unicorn.css": "css/unicorn-d41d8cd98f.css",
	"js/unicorn.js": "js/unicorn-273c2cin3f.js"
}
```

By default, `rev-manifest.json` will be replaced as a whole. To merge with an existing manifest, pass `merge: true` and the output destination (as `base`) to `rev.manifest()`:

```js
var gulp = require('gulp');
var rev = require('gulp-rev');

gulp.task('default', function () {
	// by default, gulp would pick `assets/css` as the base,
	// so we need to set it explicitly:
	return gulp.src(['assets/css/*.css', 'assets/js/*.js'], {base: 'assets'})
		.pipe(gulp.dest('build/assets'))
		.pipe(rev())
		.pipe(gulp.dest('build/assets'))
		.pipe(rev.manifest({
			base: 'build/assets',
			merge: true // merge with the existing manifest (if one exists)
		}))
		.pipe(gulp.dest('build/assets'));
});
```

You can optionally call `rev.manifest('manifest.json')` to give it a different path or filename.

##### [next: Sourcemaps and gulp-concat] (sourcemaps_and_gulp_concat.md)
