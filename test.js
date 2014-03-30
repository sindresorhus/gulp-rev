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


it('should respect directories', function (cb) {
	var stream = rev.manifest();

	stream.on('data', function (newFile) {
		assert.equal(newFile.relative, 'rev-manifest.json');
		assert.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{
				'foo/unicorn.css': 'foo/unicorn-d41d8cd9.css',
				'bar/pony.css':    'bar/pony-d41d8cd9.css'
			}
		);
		cb();
	});

	var file1 = new gutil.File({
		cwd:  __dirname,
		base: __dirname,
		path: __dirname + '/foo/unicorn-d41d8cd9.css',
		contents: new Buffer('')
	});

	file1.revOrigBase = __dirname;
	file1.revOrigPath = __dirname + '/foo/unicorn.css';
	file1.origName    = 'unicorn.css';
	file1.revName     = 'unicorn-d41d8cd9.css';

	var file2 = new gutil.File({
		cwd:  __dirname,
		base: __dirname,
		path: __dirname + '/bar/pony-d41d8cd9.css',
		contents: new Buffer('')
	});

	file2.revOrigBase = __dirname;
	file2.revOrigPath = __dirname + '/bar/pony.css';
	file2.origName    = 'pony.css';
	file2.revName     = 'pony-d41d8cd9.css';

	stream.write(file1);
	stream.write(file2);
	stream.end();
});

