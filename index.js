'use strict';
var crypto = require('crypto');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');

function md5(str) {
	return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

module.exports = function (data, options) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}
		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-rev', 'Stream content is not supported'));
			return cb();
		}
		var hash = md5(file.contents.toString()).slice(0, 8);
		var ext = path.extname(file.path);
		var filename = path.basename(file.path, ext) + '-' + hash + ext;
		file.path = path.join(path.dirname(file.path), filename);
		this.push(file);
		cb();
	});
};
