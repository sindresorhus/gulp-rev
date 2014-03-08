'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var rev = require('./index');

it('should rev files', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		assert.equal(file.path, 'unicorn-d41d8cd9.css');
		assert.equal(file.revOrigPath, 'unicorn.css');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css',
		contents: new Buffer('')
	}));
});

it('should build a rev manifest file', function (cb) {
	var stream = rev.manifest();

	stream.on('data', function (newFile) {
		assert.equal(newFile.relative, 'rev-manifest.json');
		assert.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{'unicorn.css': 'unicorn-d41d8cd9.css'}
		);
		cb();
	});

	var file = new gutil.File({
		path: 'unicorn-d41d8cd9.css',
		contents: new Buffer('')
	});

	file.revOrigPath = 'unicorn.css';

	stream.write(file);
	stream.end();
});
