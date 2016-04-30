# gulp-rev [![Build Status](https://travis-ci.org/sindresorhus/gulp-rev.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-rev)

> Static asset revisioning by appending content hash to filenames
> `unicorn.css` → `unicorn-d41d8cd98f.css`

Make sure to set the files to [never expire](http://developer.yahoo.com/performance/rules.html#expires) for this to have an effect.


## Install

```
$ npm install --save-dev gulp-rev
```


## Usage

```js
var gulp = require('gulp');
var rev = require('gulp-rev');

gulp.task('default', function () {
	return gulp.src('src/*.css')
		.pipe(rev())
		.pipe(gulp.dest('dist'));
});
```

## Docs

The documentation can be found [here](docs/readme.md).

## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
