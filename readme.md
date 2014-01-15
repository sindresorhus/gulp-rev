# [gulp](https://github.com/wearefractal/gulp)-rev [![Build Status](https://secure.travis-ci.org/sindresorhus/gulp-rev.png?branch=master)](http://travis-ci.org/sindresorhus/gulp-rev)

> Static asset revisioning by appending content hash to filenames  
`unicorn.css` => `unicorn_098f6bcd.css`

Make sure to set the files to [never expire](http://developer.yahoo.com/performance/rules.html#expires) for this to have an effect.


## Install

Install with [npm](https://npmjs.org/package/gulp-rev)

```
npm install --save-dev gulp-rev
```


## Simple Example

```js
var gulp = require('gulp');
var rev = require('gulp-rev');

gulp.task('default', function () {
	gulp.src('src/*.css')
		.pipe(rev())
		.pipe(gulp.dest('dist'));
});
```


## Advanced Example

```js
var gulp = require('gulp');
var rev = require('gulp-rev');

gulp.task('default', function() {
	var context = rev.Context();
		// The context keeps track of the original file names and
		// revisioned file name, thus allowing a Gulp task to replace
		// references to these files with a renamed one.
	gulp.src('css/**.css')
		.pipe(rev(context))
		.pipe(gulp.dest('dist/css'));
	gulp.src('index.html')
		.pipe(context.replace(/href="css\/(\w+\.css)"/g, 'href="css/{{$1}}"'))
		.pipe(gulp.dest('dist'));
});
```


## API

### rev()

Just append hashes to files passed to it.


### rev(context)

#### context

Type: `Stream`

A context stream.
As `rev(context)` processes files and add hashes to file names,
it will also pipe the original file name and modified file name through this `context` stream.


### rev.Context()

Creates a context stream for use with `rev(context)`.


### rev.Context#replace(/pattern/, "replacement")

Creates a stream that replaces the pattern with the replacement in file contents.


#### pattern

Type: `RegExp`

This regular expression will be used for searching for file references.

Examples:

* `/href="css\/(\w+\.css)"/g` for matching CSS files.


#### replacement

Type: `String`

The string to replace. May contain `$1`, `$2`, `$3`, ... for matching subpatterns.

Strings inside double brackets
(e.g. `{{hello.txt}}`)
will be replaced with the modified file name corresponding to it.
Additionally, you can use [VIM file name modifiers](http://vimdoc.sourceforge.net/htmldoc/cmdline.html#filename-modifiers).

For example, if `css/hello.css` was renamed to `css/hello_abcdef.css`...

| Replacement String | $1 | Resulting String | Final String |
| ------------------ | --- | --------------- | ------------ |
| `href="{{$1}}"` | `css/hello.css` | `href="{{css/hello.css}}` | `href="css/hello_abcdef.css"` |
| `href="css/{{$1:t}}"` | `css/hello.css` | `href="css/{{css/hello.css:t}}` | `href="css/hello_abcdef.css"` |






## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
