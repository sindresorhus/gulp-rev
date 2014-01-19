'use strict';
var crypto = require('crypto');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');

function md5(str) {
	return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

module.exports = function (options) {
	var length, seperator;
	options = options || {};
	length = options.length || 8;
	seperator = options.seperator || '-';

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-rev', 'Streaming not supported'));
			return cb();
		}

		var hash = md5(file.contents.toString()).slice(0, length);
		var ext = path.extname(file.path);
		var filename = path.basename(file.path, ext) + seperator + hash + ext;
		file.path = path.join(path.dirname(file.path), filename);
		this.push(file);
		cb();
	});
};
