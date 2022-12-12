# gulp-rev

> Static asset revisioning by appending content hash to filenames
> `unicorn.css` → `unicorn-d41d8cd98f.css`

**This project is feature complete. PRs adding new features will not be accepted.**

Make sure to set the files to [never expire](http://developer.yahoo.com/performance/rules.html#expires) for this to have an effect.

## Install

```sh
npm install --save-dev gulp-rev
```

## Usage

```js
import gulp from 'gulp';
import rev from 'gulp-rev';

export default () => (
	gulp.src('src/*.css')
		.pipe(rev())
		.pipe(gulp.dest('dist'))
);
```

## API

### rev()

### rev.manifest(path?, options?)

#### path

Type: `string`\
Default: `'rev-manifest.json'`

Manifest file path.

#### options

Type: `object`

##### base

Type: `string`\
Default: `process.cwd()`

Override the `base` of the manifest file.

##### cwd

Type: `string`\
Default: `process.cwd()`

Override the current working directory of the manifest file.

##### merge

Type: `boolean`\
Default: `false`

Merge existing manifest file.

##### transformer

Type: `object`\
Default: `JSON`

An object with `parse` and `stringify` methods. This can be used to provide a
custom transformer instead of the default `JSON` for the manifest file.

### Original path

Original file paths are stored at `file.revOrigPath`. This could come in handy for things like rewriting references to the assets.

### Asset hash

The hash of each rev'd file is stored at `file.revHash`. You can use this for customizing the file renaming, or for building different manifest formats.

### Asset manifest

```js
import gulp from 'gulp';
import rev from 'gulp-rev';

export default () => (
	// By default, Gulp would pick `assets/css` as the base,
	// so we need to set it explicitly:
	gulp.src(['assets/css/*.css', 'assets/js/*.js'], {base: 'assets'})
		.pipe(gulp.dest('build/assets'))  // Copy original assets to build dir
		.pipe(rev())
		.pipe(gulp.dest('build/assets'))  // Write rev'd assets to build dir
		.pipe(rev.manifest())
		.pipe(gulp.dest('build/assets'))  // Write manifest to build dir
);
```

An asset manifest, mapping the original paths to the revisioned paths, will be written to `build/assets/rev-manifest.json`:

```json
{
	"css/unicorn.css": "css/unicorn-d41d8cd98f.css",
	"js/unicorn.js": "js/unicorn-273c2c123f.js"
}
```

By default, `rev-manifest.json` will be replaced as a whole. To merge with an existing manifest, pass `merge: true` and the output destination (as `base`) to `rev.manifest()`:

```js
import gulp from 'gulp';
import rev from 'gulp-rev';

export default () => (
	// By default, Gulp would pick `assets/css` as the base,
	// so we need to set it explicitly:
	gulp.src(['assets/css/*.css', 'assets/js/*.js'], {base: 'assets'})
		.pipe(gulp.dest('build/assets'))
		.pipe(rev())
		.pipe(gulp.dest('build/assets'))
		.pipe(rev.manifest({
			base: 'build/assets',
			merge: true // Merge with the existing manifest if one exists
		}))
		.pipe(gulp.dest('build/assets'))
);
```

You can optionally call `rev.manifest('manifest.json')` to give it a different path or filename.

## Sourcemaps and `gulp-concat`

Because of the way `gulp-concat` handles file paths, you may need to set `cwd` and `path` manually on your `gulp-concat` instance to get everything to work correctly:

```js
import gulp from 'gulp';
import rev from 'gulp-rev';
import sourcemaps from 'gulp-sourcemaps';
import concat from 'gulp-concat';

export default () => (
	gulp.src('src/*.js')
		.pipe(sourcemaps.init())
		.pipe(concat({path: 'bundle.js', cwd: ''}))
		.pipe(rev())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))
);
```

## Different hash for unchanged files

Since the order of streams are not guaranteed, some plugins such as `gulp-concat` can cause the final file's content and hash to change. To avoid generating a new hash for unchanged source files, you can:

- Sort the streams with [gulp-sort](https://github.com/pgilad/gulp-sort)
- Filter unchanged files with [gulp-unchanged](https://github.com/sindresorhus/gulp-changed)
- Read more about [incremental builds](https://github.com/gulpjs/gulp#incremental-builds)

## Streaming

This plugin does not support streaming. If you have files from a streaming source, such as Browserify, you should use [`gulp-buffer`](https://github.com/jeromew/gulp-buffer) before `gulp-rev` in your pipeline:

```js
import gulp from 'gulp';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'gulp-buffer';
import rev from 'gulp-rev';

export default () => (
	browserify('src/index.js')
		.bundle({debug: true})
		.pipe(source('index.min.js'))
		.pipe(buffer())
		.pipe(rev())
		.pipe(gulp.dest('dist'))
);
```

## Integration

For more info on how to integrate `gulp-rev` into your app, have a look at the [integration guide](integration.md).

## Use gulp-rev in combination with one or more of

It may be useful - and necessary - to use `gulp-rev` with other packages to complete the task.

- [gulp-rev-rewrite](https://github.com/TheDancingCode/gulp-rev-rewrite) - Rewrite occurrences of filenames which have been renamed
- [gulp-rev-css-url](https://github.com/galkinrost/gulp-rev-css-url) - Override URLs in CSS files with the revved ones
- [gulp-rev-outdated](https://github.com/shonny-ua/gulp-rev-outdated) - Old static asset revision files filter
- [gulp-rev-collector](https://github.com/shonny-ua/gulp-rev-collector) - Static asset revision data collector
- [rev-del](https://github.com/callumacrae/rev-del) - Delete old unused assets
- [gulp-rev-delete-original](https://github.com/nib-health-funds/gulp-rev-delete-original) - Delete original files after rev
- [gulp-rev-dist-clean](https://github.com/alexandre-abrioux/gulp-rev-dist-clean) - Clean up temporary and legacy files created by gulp-rev 
- [gulp-rev-loader](https://github.com/adjavaherian/gulp-rev-loader) - Use rev-manifest with webpack
- [gulp-rev-format](https://github.com/atamas101/gulp-rev-format) - Provide hash formatting options for static assets (prefix, suffix, last-extension)
- [gulp-rev-sri](https://github.com/shaunwarman/gulp-rev-sri) - Add subresource integrity field to rev-manifest
