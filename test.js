'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var rev = require('./index');

it('should rev files', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		assert.equal(file.path, 'unicorn-d41d8cd9.css');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css',
		contents: new Buffer('')
	}));
});

it('should take optional seperator', function (cb) {
	var stream = rev({
		seperator: '*'
	});

	stream.on('data', function (file) {
		assert.equal(file.path, 'unicorn*d41d8cd9.css');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css',
		contents: new Buffer('')
	}));
});

it('should take optional length', function (cb) {
	var stream = rev({
		length: 13
	});

	stream.on('data', function (file) {
		assert.equal(file.path, 'unicorn-d41d8cd98f00b.css');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css',
		contents: new Buffer('')
	}));
});
