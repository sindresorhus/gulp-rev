# gulp-rev
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

##### [next: API] (api/rev/rev.md)
