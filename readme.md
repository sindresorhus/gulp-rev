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

1.  API
	-	[rev()](docs/api/rev/rev.md)
		-   [Asset manifest](docs/api/rev/asset_manifest.md)
2.	[Sourcemaps and gulp-concat](docs/api/sourcemaps_and_gulp_concat.md)
3.  [Streaming](docs/api/streaming.md)
4.	[Integration](docs/api/integration.md)
5.	[Works with gulp-rev](docs/api/works_with_gulp_rev.md)

## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
