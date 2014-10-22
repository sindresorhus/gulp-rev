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
var plugin = function () {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-rev', 'Streaming not supported'));
			return;
		}

		// save the old path for later
		file.revOrigPath = file.path;
		file.revOrigBase = file.base;

		var hash = file.revHash = md5(file.contents).slice(0, 8);
		var ext = path.extname(file.path);
		var filename = path.basename(file.path, ext) + '-' + hash + ext;
		file.path = path.join(path.dirname(file.path), filename);
		cb(null, file);
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
