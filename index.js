'use strict';
var crypto = require('crypto');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var objectAssign = require('object-assign');

function md5(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

function relPath(base, filePath) {
	if (filePath.indexOf(base) !== 0) {
		return filePath.replace(/\\/g, '/');
	}

	var newPath = filePath.substr(base.length).replace(/\\/g, '/');

	if (newPath[0] === '/') {
		return newPath.substr(1);
	}

	return newPath;
}

function transformFilename(file) {
	// save the old path for later
	file.revOrigPath = file.path;
	file.revOrigBase = file.base;

	var hash = file.revHash = md5(file.contents).slice(0, 8);
	var ext = path.extname(file.path);
	var filename = path.basename(file.path, ext) + '-' + hash + ext;
	file.path = path.join(path.dirname(file.path), filename);
}

var plugin = function (options) {

	var sourcemaps = [],
		pathMap = {},
		options = options || {},
		destPath = options.sourcemapDestPath || '';

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-rev', 'Streaming not supported'));
			return;
		}

		if (path.extname(file.path) == '.map') {
			// This is a sourcemap, hold until the end
			sourcemaps.push(file);
			cb();
		} else {
			var oldPath = file.path;
			transformFilename(file);
			pathMap[oldPath] = file.path;
			cb(null, file);
		}
	}, function(cb) {

		for (var i = 0; i < sourcemaps.length; i++) {

			var file = sourcemaps[i];
			var basename = path.basename(file.path, '.map');
			var reverseFilename = path.relative(destPath, path.join(path.dirname(file.path), basename));

			if (pathMap[reverseFilename]) {
				// save the old path for later
				file.revOrigPath = file.path;

				file.path = path.join(path.dirname(pathMap[reverseFilename]), destPath, path.basename(pathMap[reverseFilename])) + '.map';
			} else {
				transformFilename(file);
			}

			this.push(file);

		}

		cb();

	});
};

plugin.manifest = function (opt) {
	opt = objectAssign({path: 'rev-manifest.json'}, opt || {});
	var manifest = {};
	var firstFile = null;

	return through.obj(function (file, enc, cb) {
		// ignore all non-rev'd files
		if (!file.path || !file.revOrigPath) {
			cb();
			return;
		}

		// combine previous manifest
		// only add if key isn't already there
		if (opt.path == file.revOrigPath) {
			var existingManifest = JSON.parse(file.contents.toString());
			manifest = objectAssign(existingManifest, manifest);
		// add file to manifest
		} else {
			firstFile = firstFile || file;
			manifest[relPath(firstFile.revOrigBase, file.revOrigPath)] = relPath(firstFile.base, file.path);
		}

		cb();
	}, function (cb) {
		if (firstFile) {
			this.push(new gutil.File({
				cwd: firstFile.cwd,
				base: firstFile.base,
				path: path.join(firstFile.base, opt.path),
				contents: new Buffer(JSON.stringify(manifest, null, '  '))
			}));
		}

		cb();
	});
};

module.exports = plugin;
