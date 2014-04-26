
Integrating gulp-env into your app
==================================

Outlined below are two common approaches to integrating an asset manifest like the one __gulp-rev__ outputs into an application.

For our examples, we'll assume the following manifest:

__rev-manifest.json__

```json
{
  "js/app.js": "js/app-5c41412f.js",
  "js/lib.js": "js/lib-6d94673e.js",
  "css/app.css": "css/app-a4ae3dfa.css",
}
````


Approach #1 - AJAX in manifest, inject assets into the page
----------------------------------------------------------------

One approach to working with `rev-manifest.json` is to make an AJAX request to get the manifest JSON blob, then use the manifest to programmatically find the fingerprinted path to any given asset.

For example, if you wanted to include your javascript files into the page:

```javascript
$.getJSON('/path/to/rev-manifest.json', function(manifest){
  var s = document.getElementsByTagName('script')[0];

  var assetPath = function(src){
    src = 'js/' + src + '.js'
    return [ '/assets', manifest[src] ];
  };

  [ 'lib', 'app' ].forEach(function(src) {
      var el = document.createElement('script');
      el.async = true;
      el.src = assetPath(src);
      s.parentNode.insertBefore(el, s);
  });
})
````

The above example assumes your assets live under `/assets` on your server.


Approach #2 - Generate index.html during build
-----------------------------------------------

Another approach would be to use a templating language, such as [handlebars](http://handlebarsjs.com/), to generate an `index.html` file which contained your fingerprinted files embedded into the page.

The idea is to read in your app's `rev-manifest.json`, and use the non-fingerprinted path to read in the fingerprinted path and inject it into the page. Note, this approach requires the `'compile index.html'` task to be run as part of your build process.

__index.hbs__

```html
<!DOCTYPE html>
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

__gulpfile.js__

```javascript
var gulp        = require('gulp');
var handlebars  = require('gulp-compile-handlebars');
var rename      = require('gulp-rename');
var fs          = require('fs');

// Create handlebars helper to look up
// fingerprinted asset by non-fingerprinted
// name.
var handlebarOpts = {
  helpers: {
    assetPath: function(path, context){
      return [ '/assets', context.data.root[path] ].join('/');
    }
  }
};

gulp.task('compile index.html', function(){

  // Read in our manifest file.
  var manifest = JSON.parse(fs.readFileSync('path/to/rev-manifest.json', 'utf8'));

  // Read in our handlebars template, compile it using
  // our manifest, and output it to index.html
  return gulp.src('index.hbs')
      .pipe(handlebars(manifest, handlebarOpts))
      .pipe(rename('index.html'))
      .pipe(gulp.dest('public'));

});
```
