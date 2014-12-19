'use strict';
var crypto = require('crypto');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var objectAssign = require('object-assign');
var file = require('vinyl-file');

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

function readExistingManifestFile(pth, opt) {
	try {
		if (opt.appendExisting) {
			return file.readSync(path.join(opt.base, pth), opt);
		}
	}
	catch (e) {
		// no existing manifest found at path.join(opt.base, pth)
	}

	return new gutil.File({
		cwd: opt.cwd,
		base: opt.base,
		path: path.join(opt.base, pth)
	});
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

var plugin = function () {
	var sourcemaps = [];
	var pathMap = {};

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-rev', 'Streaming not supported'));
			return;
		}

		if (path.extname(file.path) === '.map') {
			// This is a sourcemap, hold until the end
			sourcemaps.push(file);
			cb();
		} else {
			var oldPath = file.path;
			transformFilename(file);
			pathMap[oldPath] = file.revHash;
			cb(null, file);
		}
	}, function(cb) {

		sourcemaps.forEach(function(file) {
			// attempt to parse the sourcemap's JSON to get the reverse filename
			var reverseFilename;
			var relativePath;
			try {
				var sourcemap = JSON.parse(file.contents.toString());
				reverseFilename = sourcemap.file;
				relativePath = path.relative(path.dirname(reverseFilename), path.dirname(file.path));
			} catch(e) {}

			if (!reverseFilename) {
				var basename = path.basename(file.path, '.map');
				reverseFilename = path.relative(path.dirname(file.path), basename);
				relativePath = '.';
			}

			if (pathMap[reverseFilename]) {
				// save the old path for later
				file.revOrigPath = file.path;
				file.revOrigBase = file.base;

				var hash = pathMap[reverseFilename];
				var origPath = path.join(path.dirname(file.path), path.basename(file.path, '.map'));
				var ext = path.extname(origPath);
				var filename = path.basename(origPath, ext) + '-' + hash + ext + '.map';
				file.path = path.join(path.dirname(origPath), filename);
			} else {
				transformFilename(file);
			}

			this.push(file);

		}, this);

		cb();

	});
};

plugin.manifest = function (opt) {
	opt = objectAssign({path: 'rev-manifest.json', base: '.', appendExisting: false}, opt || {});
	var firstFile = null;

	var manifestFile = readExistingManifestFile(opt.path, opt);
	var manifest = manifestFile.isNull() ? {} : JSON.parse(manifestFile.contents.toString());

	return through.obj(function (file, enc, cb) {
		// ignore all non-rev'd files
		if (!file.path || !file.revOrigPath) {
			cb();
			return;
		}

		firstFile = firstFile || file;
		manifest[relPath(firstFile.revOrigBase, file.revOrigPath)] = relPath(firstFile.base, file.path);

		cb();
	}, function (cb) {
		if (firstFile) {
			manifestFile.contents = new Buffer(JSON.stringify(manifest, null, '  '));
			this.push(manifestFile);
		}

		cb();
	});
};

module.exports = plugin;
