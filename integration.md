# Integrating gulp-rev into your app

Outlined below are three common approaches to integrating an asset manifest like the one **gulp-rev** outputs into an application.

For our examples, we'll assume the following `rev-manifest.json`:

```json
{
	"js/app.js": "js/app-5c41412f32.js",
	"js/lib.js": "js/lib-6d94673e3d.js",
	"css/app.css": "css/app-a4ae3dfa4d.css"
}
```


## Approach #1 - Generate index.html during build

One approach to working with `rev-manifest.json` is to use a templating language, such as [handlebars](http://handlebarsjs.com), to generate an `index.html` file which contained your fingerprinted files embedded into the page.

The idea is to read in your app's `rev-manifest.json`, and use the non-fingerprinted path to read in the fingerprinted path and inject it into the page. Note, this approach requires the `'compile-index-html'` task to be run as part of your build process.

#### `index.hbs`

```html+jinja
<!doctype html>
<html>
	<head>
		<title>My App</title>
		<link rel="stylesheet" href="{{ assetPath "css/app.css" }}">
	</head>
	<body>
		<script src="{{ assetPath "js/lib.js" }}"></script>
		<script src="{{ assetPath "js/app.js" }}"></script>
	</body>
</html>
```

#### `gulpfile.js`

```js
const fs = require('fs');
const gulp = require('gulp');
const handlebars = require('gulp-compile-handlebars');
const rename = require('gulp-rename');

// Create a handlebars helper to look up
// fingerprinted asset by non-fingerprinted name
const handlebarOpts = {
	helpers: {
		assetPath: (path, context) => ['/assets', context.data.root[path]].join('/')
	}
};

exports['compile-index-html'] = () => {
	// Read in our manifest file
	const manifest = JSON.parse(fs.readFileSync('path/to/rev-manifest', 'utf8'));

	// Read in our handlebars template, compile it using
	// our manifest, and output it to index.html
	return gulp.src('index.hbs')
		.pipe(handlebars(manifest, handlebarOpts))
		.pipe(rename('index.html'))
		.pipe(gulp.dest('public'));
};
```


## Approach #2 - AJAX in manifest, inject assets into the page

Another approach would be to make a AJAX request to get the manifest JSON blob, then use the manifest to programmatically find the fingerprinted path to any given asset.

For example, if you wanted to include your JavaScript files into the page:

```js
$.getJSON('/path/to/rev-manifest.json', manifest => {
	const s = document.getElementsByTagName('script')[0];

	const assetPath = src => {
		src = `js/${src}.js`;
		return ['/assets', manifest[src]].join('/');
	};

	for (const src of ['lib', 'app']) {
		const element = document.createElement('script');
		element.async = true;
		element.src = assetPath(src);
		s.parentNode.insertBefore(element, s);
	}
})
```

The above example assumes your assets live under `/assets` on your server.


## Approach #3 - PHP reads the manifest and provides asset names

This example PHP function provides the correct filename by reading it from the JSON manifest.

If the file is not present in the manifest it will return the original filename.

```php
/**
 * @param string $filename
 * @return string
 */
function asset_path($filename) {
	$manifest_path = 'assets/rev-manifest.json';

	if (file_exists($manifest_path)) {
		$manifest = json_decode(file_get_contents($manifest_path), TRUE);
	} else {
		$manifest = [];
	}

	if (array_key_exists($filename, $manifest)) {
		return $manifest[$filename];
	}

	return $filename;
}
````

You can then call `asset_path` to get the rev'd path of your assets: `echo asset_path('js/main.js');`

Using [blade](http://laravel.com/docs/templates) your templates would look like this:

```html+jinja
<!doctype html>
<html>
	<head>
		<title>My App</title>
		<link rel="stylesheet" href="{{ asset_path('css/app.css') }}">
	</head>
	<body>
		<script src="{{ asset_path('js/lib.js') }}"></script>
		<script src="{{ asset_path('js/app.js') }}"></script>
	</body>
</html>
```
