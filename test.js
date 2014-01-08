'use strict';
/*global describe, it*/
var assert = require('assert');
var gutil = require('gulp-util');
var rev = require('./index');

describe('rev', function() {

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

	it('given context, rev should call #put on it', function (cb) {
		
		var context = { };
		var ok = false;

		context.put = function(oldPath, newPath) {
			assert.equal(oldPath, '~/dev/foo/unicorn.css');
			assert.equal(newPath, '~/dev/foo/unicorn_098f6bcd.css');
			ok = true;
		};

		var stream = rev(context);

		stream.on('data', function () {
			assert.ok(ok, 'context#put should have been called!');
			cb();
		});

		stream.write(new gutil.File({
			path: '~/dev/foo/unicorn.css',
			contents: 'test'
		}));

	});

	it('given context, rev should call #end when finish', function (cb) {
		
		var context = { };
		var ok = false;

		context.end = function() {
			ok = true;
		};

		var stream = rev(context);

		stream.on('end', function () {
			assert.ok(ok, 'context#end should have been called!');
			cb();
		});

		stream.end();

	});

});

describe('rev.Context', function() {

	it('#get should return the file name or throw', function () {
		var context = rev.Context();
		context.put('hello', 'world');
		context.put('test', 'that');
		assert.equal(context.get('hello'), 'world');
		assert.throws(function () {
			context.get('hasOwnProperty');
		});
		assert.throws(function () {
			context.get('trolol');
		});
	});

	it('#replace should replace the regular expression with the file', function (cb) {
		
		var context = rev.Context();

		context.put('hello', 'world');
		context.put('test', 'that');
		context.end();

		var stream = context.replace(/<!-- (.*) -->/, '<a href="{{$1}}">{{hello}}</a>');

		stream.on('data', function (data) {
			assert.equal(data.contents.toString(),
				'Hello, <a href="that">world</a> yeah');
			cb();
		});

		stream.on('error', cb);

		stream.write(new gutil.File({
			path: 'index.html',
			contents: 'Hello, <!-- test --> yeah'
		}));

	});

});












