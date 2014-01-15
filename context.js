'use strict';
var Q = require('q');
var es = require('event-stream');
var fnamemodify = require('fnamemodify');

function compile(pattern, replacement) {
	return function (text) {
		var context = this;
		return text.replace(pattern, replacement)
		.replace(/\{\{(.*?)\}\}/g, function(_, name) {
			var parts = fnamemodify.extract(name);
			return fnamemodify(context.get(parts.fname), parts.mods);
		});
	};
}

function replace(promise, pattern, replacement) {

	if (typeof replacement === 'string') {
		replacement = compile(pattern, replacement);
	}

	return es.map(function (file, cb) {
		promise.then(function(context) {
			var contents = String(file.contents);
			contents = contents.replace(pattern, replacement.bind(context));
			file.contents = new Buffer(contents);
			cb(null, file);
		}).then(null, cb).done();
	});

}

module.exports = function Context() {

	var context = es.through(function(event) {
		context._put(event.old, event.new);
	});

	var map = { };
	var defer = Q.defer();
	var promise = defer.promise;

	context._put = function(oldPath, newPath) {
		map[oldPath] = newPath;
	};

	context.get = function(path) {
		if (!Object.prototype.hasOwnProperty.call(map, path)) {
			throw new Error('gulp-rev: File not found: ' + path);
		}
		return map[path];
	};

	context.end = function() {
		defer.resolve(context);
	};

	context.replace = replace.bind(null, promise);

	return context;

};





