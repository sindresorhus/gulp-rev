'use strict';
var crypto = require('crypto');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var objectAssign = require('object-assign');
var file = require('vinyl-file');

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

function getManifestFile(opts, cb) {
	file.read(opts.path, opts, function (err, manifest) {
		if (err) {
			// not found
			if (err.code === 'ENOENT') {
				cb(null, new gutil.File(opts));
			} else {
				cb(err);
			}

			return;
		}

		cb(null, manifest);
	});
}

function transformFilename(file, transformer, hasher) {
	// Save original path and base
	file.revOrigPath = file.path;
	file.revOrigBase = file.base;

	// Generate a hash
	file.revHash = hasher(file);

	if (typeof file.revHash !== 'string')
		throw 'Hasher didn\'t return a string.';

	// Transform the filename
	var filename = transformer(file, file.revHash);

	if (typeof filename !== 'string')
		throw 'Name transformer didn\'t return a string.';

	// Store the new path
	file.path = path.join(path.dirname(file.path), filename);
}

var plugin = function (opts) {
	opts = objectAssign({
		transformer: plugin.defaultTransformer,
		hasher: plugin.md5Hasher
	}, opts);

	// Check types
	if (opts.transformer && typeof opts.transformer !== 'function')
		throw 'Provided transformer must be a function.';

	if (opts.hasher && typeof opts.hasher !== 'function')
		throw 'Provided hasher must be a function.';

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

		// This is a sourcemap, hold until the end
		if (path.extname(file.path) === '.map') {
			sourcemaps.push(file);
			cb();
			return;
		}

		// Transform the file name
		transformFilename(file, opts.transformer, opts.hasher);

		// Store the hash
		pathMap[file.revOrigPath] = file.revHash;

		cb(null, file);

	}, function(cb) {
		sourcemaps.forEach(function (file) {
			var reverseFilename;

			// attempt to parse the sourcemap's JSON to get the reverse filename
			try {
				reverseFilename = JSON.parse(file.contents.toString()).file;
			} catch (err) {}

			if (!reverseFilename) {
				reverseFilename = path.relative(path.dirname(file.path), path.basename(file.path, '.map'));
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
				transformFilename(file, opts.transformer, opts.hasher);
			}

			this.push(file);
		}, this);

		cb();
	});
};

plugin.manifest = function (pth, opts) {
	if (typeof pth === 'string') {
		pth = {path: pth};
	}

	opts = objectAssign({
		path: 'rev-manifest.json',
		merge: false
	}, opts, pth);

	var firstFile = null;
	var manifest  = {};

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
		// no need to write a manifest file if there's nothing to manifest
		if (Object.keys(manifest).length === 0) {
			cb();
			return;
		}

		getManifestFile(opts, function (err, manifestFile) {
			if (err) {
				cb(err);
				return;
			}

			if (opts.merge && !manifestFile.isNull()) {
				var oldManifest = {};

				try {
					oldManifest = JSON.parse(manifestFile.contents.toString());
				} catch (err) {}

				manifest = objectAssign(oldManifest, manifest);
			}

			manifestFile.contents = new Buffer(JSON.stringify(manifest, null, '  '));
			this.push(manifestFile);
			cb();
		}.bind(this));
	});
};

plugin.md5Hasher = function (file) {
	// MD5 the file contents
	var hash = crypto.createHash('md5').update(file.contents).digest('hex');

	// Get the first 8 characters
	hash = hash.slice(0, 8)

	return hash;
};

plugin.defaultTransformer = function (file, hash) {
	// Get the file extension
	var ext = path.extname(file.path);

	// Build a new filename with the hash
	var filename = path.basename(file.path, ext) + '-' + hash + ext;

	return filename;
};

plugin.fullextTransformer = function (file, hash) {
	// Get all file extensions so we end up with 'file-hash.min.css' instead of 'file.min-hash.css'
	var ext = '';
	while (path.extname(path.basename(file.path, ext)).length) {
		ext = path.extname(path.basename(file.path, ext)) + ext;
	}

	// Build a new filename with the hash
	var filename = path.basename(file.path, ext) + '-' + hash + ext;

	return filename;
};

module.exports = plugin;
