'use strict';
var crypto = require('crypto');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');

function md5(str) {
	return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

var plugin = function () {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-rev', 'Streaming not supported'));
			return cb();
		}

		// save the old path for later
		file.revOrigPath = file.path;
		file.revOrigBase = file.base;

		var hash = md5(file.contents.toString()).slice(0, 8);
		var ext = path.extname(file.path);
		var filename = path.basename(file.path, ext) + '-' + hash + ext;

		// save the original filename and rev'd file name
		file.origName = path.basename(file.path, ext) + ext;
		file.revName = filename;

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
		if (file.path && file.revName) {
			firstFile = firstFile || file;
			manifest[file.origName] = file.revName;
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
