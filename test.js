'use strict';
var path = require('path');
var assert = require('assert');
var gutil = require('gulp-util');
var rev = require('./');

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

it('should allow naming the manifest file', function (cb) {
	var path = 'manifest.json';
	var stream = rev.manifest({path: path});

	stream.on('data', function (newFile) {
		assert.equal(newFile.relative, path);
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

it('should append to an existing rev manifest file (from stream)', function (cb) {
	var stream = rev.manifest();

	stream.on('data', function (newFile) {
		assert.equal(newFile.relative, 'rev-manifest.json');
		assert.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{'app.js': 'app-a41d8cd1.js', 'unicorn.css': 'unicorn-d41d8cd9.css'}
		);
		cb();
	});

	var mFile = new gutil.File({
		path: 'rev-manifest.json',
		contents: new Buffer('{ "app.js": "app-a41d8cd1.js", "unicorn.css": "unicorn-b41d8cd2.css" }')
	});
	mFile.revOrigPath = 'rev-manifest.json';

	var file = new gutil.File({
		path: 'unicorn-d41d8cd9.css',
		contents: new Buffer('')
	});

	file.revOrigPath = 'unicorn.css';

	stream.write(mFile);
	stream.write(file);
	stream.end();
});

it('should append to an existing rev manifest file (from file)', function (cb) {
	var stream = rev.manifest({path: 'test.manifest-fixture.json'});

	stream.on('data', function (newFile) {
		assert.equal(newFile.relative, 'test.manifest-fixture.json');
		assert.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{'app.js': 'app-a41d8cd1.js', 'unicorn.css': 'unicorn-d41d8cd9.css'}
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
		var MANIFEST = {};
		MANIFEST[path.join('foo', 'unicorn.css')] = path.join('foo', 'unicorn-d41d8cd9.css');
		MANIFEST[path.join('bar', 'pony.css')] = path.join('bar', 'pony-d41d8cd9.css');

		assert.equal(newFile.relative, 'rev-manifest.json');
		assert.deepEqual(JSON.parse(newFile.contents.toString()), MANIFEST);
		cb();
	});

	var file1 = new gutil.File({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'foo', 'unicorn-d41d8cd9.css'),
		contents: new Buffer('')
	});

	file1.revOrigBase = __dirname;
	file1.revOrigPath = path.join(__dirname, 'foo', 'unicorn.css');
	file1.origName = 'unicorn.css';
	file1.revName = 'unicorn-d41d8cd9.css';

	var file2 = new gutil.File({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'bar', 'pony-d41d8cd9.css'),
		contents: new Buffer('')
	});

	file2.revOrigBase = __dirname;
	file2.revOrigPath = path.join(__dirname, 'bar', 'pony.css');
	file2.origName = 'pony.css';
	file2.revName = 'pony-d41d8cd9.css';

	stream.write(file1);
	stream.write(file2);
	stream.end();
});

it('should store the hashes for later', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		assert.equal(file.path, 'unicorn-d41d8cd9.css');
		assert.equal(file.revOrigPath, 'unicorn.css');
		assert.equal(file.revHash, 'd41d8cd9');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css',
		contents: new Buffer('')
	}));
});
