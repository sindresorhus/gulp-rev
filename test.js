'use strict';
var assert = require('assert');
var path = require('path');
var gutil = require('gulp-util');
var rev = require('./index');

it('should rev files', function (cb) {
	var stream = rev();

	stream.on('data', function (data) {
		assert.equal(data.path, '~/dev/foo/unicorn_098f6bcd.css');
		cb();
	});

	stream.write(new gutil.File({
		path: '~/dev/foo/unicorn.css',
		contents: 'test'
	}));
});
