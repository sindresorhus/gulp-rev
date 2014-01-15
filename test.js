'use strict';
/*global describe, it*/
var assert = require('assert');
var gutil = require('gulp-util');
var rev = require('./index');
var es = require('event-stream');

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

	it('given context, rev should pipe file names to it', function (cb) {

		var context = es.through(function(event) {
			assert.equal(event.old, 'foo/unicorn.css');
			assert.equal(event.new, 'foo/unicorn_098f6bcd.css');
		}, function() {
			cb();
		});

		var stream = rev(context);

		stream.write(new gutil.File({
			path: '~/dev/foo/unicorn.css',
			base: '~/dev/',
			contents: 'test'
		}));

		stream.end();

	});

});

describe('rev.Context', function() {

	it('#get should return the file name or throw', function () {
		var context = rev.Context();
		context.write({ old: 'hello', new: 'world' });
		context.write({ old: 'test',  new: 'that' });
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

		context.write({ old: 'hello', new: 'world' });
		context.write({ old: 'test',  new: 'that.txt' });
		context.end();

		var stream = context.replace(/<!-- (.*) -->/, '<a href="{{$1}}">{{hello}}.{{$1:e}}</a>');

		stream.on('data', function (data) {
			assert.equal(data.contents.toString(),
				'Hello, <a href="that.txt">world.txt</a> yeah');
			cb();
		});

		stream.on('error', cb);

		stream.write(new gutil.File({
			path: 'index.html',
			contents: 'Hello, <!-- test --> yeah'
		}));

	});

});












