'use strict';
var crypto = require('crypto');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var fs = require('fs');

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

		var source = file.path;
		var hash = md5(file.contents.toString()).slice(0, 8);
		var ext = path.extname(file.path);
		var filename = path.basename(file.path, ext) + '-' + hash + ext;
		var revved = path.join(path.dirname(file.path), filename);
		file.path = revved;
		this.push(file);
		
		plugin.map[source] = revved;
		
		cb();
	});
};

plugin.map = {};

plugin.save = function(fileName){
	fs.writeFile(fileName, JSON.stringify(plugin.map), function (err) {
	  if (err) throw err;
	});
}
module.exports = plugin;
