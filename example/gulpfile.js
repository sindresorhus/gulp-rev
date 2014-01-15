'use strict';

var gulp = require('gulp');
var rev = require('../');

gulp.task('default', function() {
	var context = rev.Context();
	gulp.src('css/**.css')
		.pipe(rev(context))
		.pipe(gulp.dest('dist/css'));
	gulp.src('index.html')
		.pipe(context.replace(/href="css\/(\w+\.css)"/g, 'href="css/{{$1}}"'))
		.pipe(gulp.dest('dist'));
});
