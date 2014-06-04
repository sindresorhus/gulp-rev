'use strict';

var crypto = require('crypto');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var pluginName = 'gulp-rev';

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

var plugin = function () {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError(pluginName, 'Streaming not supported'));
			return cb();
		}

		// save the old path for later
		file.revOrigPath = file.path;
		file.revOrigBase = file.base;

		var hash = file.revHash = md5(file.contents.toString()).slice(0, 8);
		var ext = path.extname(file.path);
		var filename = path.basename(file.path, ext) + '-' + hash + ext;
		file.path = path.join(path.dirname(file.path), filename);
		this.push(file);
		cb();
	});
};

plugin.manifest = function (options) {
  options = options || {};

  var manifestName = options.manifestName || 'rev-manifest.json';
	var manifest = {};
	var firstFile = null;

  if (options.existingManifest) {
    if (typeof options.existingManifest === 'string') {
      try {
        manifest = require(path.join(process.cwd(), options.existingManifest)) || {};
      } catch(err) {
        // pass through
        manifest = {};
      }
    } 
    else if (typeof options.existingManifest === 'object') {
      manifest = options.existingManifest;
    }
  }

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
				path: path.join(firstFile.base, manifestName),
				contents: new Buffer(JSON.stringify(manifest, null, '  '))
			}));
		}

		cb();
	});
};

module.exports = plugin;
