'use strict';
var crypto = require('crypto');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');

function md5(str) {
	return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

function relPath(base, filePath) {
	if (filePath.indexOf(base) !== 0) {
		return filePath;
	}
	var newPath = filePath.substr(base.length);
	if (newPath[0] === path.sep) {
		return newPath.substr(1);
	} else {
		return newPath;
	}
}

var plugin = function (options) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-rev', 'Streaming not supported'));
			return cb();
		}

		options = options || {};
		var format = options.format || '{name}-{hash}.{ext}';

		// save the old path for later
		file.revOrigPath = file.path;
		file.revOrigBase = file.base;

		var hash = md5(file.contents.toString()).slice(0, 8);
		var ext = path.extname(file.path);
		var filename = format.replace('{name}', path.basename(file.path, ext)).replace('{hash}', hash).replace('{ext}', ext.substring(1));
		file.path = path.join(path.dirname(file.path), filename);
		this.push(file);
		cb();
	});
};

plugin.manifest = function () {
	var manifest  = {};
	var firstFile = null;

	return through.obj(function (file, enc, cb) {
		// ignore all non-rev'd files
		if (file.path && file.revOrigPath) {
			firstFile = firstFile || file;
			manifest[relPath(firstFile.revOrigBase, file.revOrigPath)] = relPath(firstFile.base, file.path);
		}

		cb();
	}, function (cb) {
		if (firstFile) {
			this.push(new gutil.File({
				cwd: firstFile.cwd,
				base: firstFile.base,
				path: path.join(firstFile.base, 'rev-manifest.json'),
				contents: new Buffer(JSON.stringify(manifest, null, '  '))
			}));
		}

		cb();
	});
};

module.exports = plugin;
