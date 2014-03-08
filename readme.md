# [gulp](https://github.com/wearefractal/gulp)-rev [![Build Status](https://travis-ci.org/sindresorhus/gulp-rev.png?branch=master)](https://travis-ci.org/sindresorhus/gulp-rev)

> Static asset revisioning by appending content hash to filenames  
`unicorn.css` => `unicorn-098f6bcd.css`

Make sure to set the files to [never expire](http://developer.yahoo.com/performance/rules.html#expires) for this to have an effect.


## Install

```bash
$ npm install --save-dev gulp-rev
```


## Example

```js
var gulp = require('gulp');
var rev = require('gulp-rev');

gulp.task('default', function () {
	gulp.src('src/*.css')
		.pipe(rev())
		.pipe(gulp.dest('dist'));
});
```

*Options are intentionally missing as the default should work in most cases.*


### Original path

Original file paths are stored at `file.revOrigPath`. This could come in handy for things like rewriting references to the assets.


### Asset manifest

```js
var gulp = require('gulp');
var rev = require('gulp-rev');

gulp.task('default', function () {
	gulp.src('src/*.css')
		.pipe(rev())
		.pipe(gulp.dest('dist'))  // write revisioned assets to /dist
		.pipe(rev.manifest())     // generate a revision manifest file
		.pipe(gulp.dest('dist')); // write it to /dist/rev-manifest.json
});
```

An asset manifest, mapping the original paths to the revisioned paths, will be written to `dist/rev-manifest.json`:

```json
{
	"unicorn.css": "unicorn-098f6bcd.css"
}
```


## License

[MIT](http://opensource.org/licenses/MIT) © [Sindre Sorhus](http://sindresorhus.com)
