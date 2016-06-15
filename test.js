'use strict';
var path = require('path');
var assert = require('assert');
var gutil = require('gulp-util');
var rev = require('./');

it('should rev files', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		assert.equal(file.path, 'unicorn-d41d8cd98f.css');
		assert.equal(file.revOrigPath, 'unicorn.css');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css',
		contents: new Buffer('')
	}));
});

it('should add the revision hash before the first `.` in the filename', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		assert.equal(file.path, 'unicorn-d41d8cd98f.css.map');
		assert.equal(file.revOrigPath, 'unicorn.css.map');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css.map',
		contents: new Buffer('')
	}));

	stream.end();
});

it('should store the hashes for later', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		assert.equal(file.path, 'unicorn-d41d8cd98f.css');
		assert.equal(file.revOrigPath, 'unicorn.css');
		assert.equal(file.revHash, 'd41d8cd98f');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css',
		contents: new Buffer('')
	}));
});

it('should handle sourcemaps transparently', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		if (path.extname(file.path) === '.map') {
			assert.equal(file.path, 'maps/pastissada-d41d8cd98f.css.map');
			cb();
		}
	});

	stream.write(new gutil.File({
		path: 'pastissada.css',
		contents: new Buffer('')
	}));

	stream.end(new gutil.File({
		path: 'maps/pastissada.css.map',
		contents: new Buffer(JSON.stringify({file: 'pastissada.css'}))
	}));
});

it('should handle unparseable sourcemaps correctly', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		if (path.extname(file.path) === '.map') {
			assert.equal(file.path, 'pastissada-d41d8cd98f.css.map');
			cb();
		}
	});

	stream.write(new gutil.File({
		path: 'pastissada.css',
		contents: new Buffer('')
	}));

	stream.end(new gutil.File({
		path: 'pastissada.css.map',
		contents: new Buffer('Wait a minute, this is invalid JSON!')
	}));
});

it('should be okay when the optional sourcemap.file is not defined', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		if (path.extname(file.path) === '.map') {
			assert.equal(file.path, 'pastissada-d41d8cd98f.css.map');
			cb();
		}
	});

	stream.write(new gutil.File({
		path: 'pastissada.css',
		contents: new Buffer('')
	}));

	stream.end(new gutil.File({
		path: 'pastissada.css.map',
		contents: new Buffer(JSON.stringify({}))
	}));
});

it('should handle a . in the folder name', function (cb) {
	var stream = rev();

	stream.on('data', function (file) {
		assert.equal(file.path, 'mysite.io/unicorn-d41d8cd98f.css');
		assert.equal(file.revOrigPath, 'mysite.io/unicorn.css');
		cb();
	});

	stream.write(new gutil.File({
		path: 'mysite.io/unicorn.css',
		contents: new Buffer('')
	}));
});
