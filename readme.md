# [gulp](https://github.com/wearefractal/gulp)-rev [![Build Status](https://secure.travis-ci.org/sindresorhus/gulp-rev.png?branch=master)](http://travis-ci.org/sindresorhus/gulp-rev)

> Static asset revisioning by appending content hash to filenames  
`unicorn.css` => `unicorn-098f6bcd.css`

Make sure to set the files to [never expire](http://developer.yahoo.com/performance/rules.html#expires) for this to have an effect.


## Install

Install with [npm](https://npmjs.org/package/gulp-rev)

```
npm install --save-dev gulp-rev
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

Options are intentionally missing as the default should work in most cases.


### Asset manifest

```js
var gulp = require('gulp');
var rev = require('gulp-rev');

gulp.task('default', function () {
	gulp.src('src/*.css')
		.pipe(rev())
		.pipe(gulp.dest('dist'));
		.pipe(rev.manifest())
		.pipe(gulp.dest('dist'));
});
```

An asset manifest will be written to `dist/manifest.json`:

```json
{
  "unicorn.css": "unicorn-098f6bcd.css"
}
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
