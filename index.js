'use strict';
var crypto = require('crypto');
var path = require('path');
var es = require('event-stream');

function md5(str) {
	return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

module.exports = function (context) {
	return es.map(function (file, cb) {
		var hash = md5(file.contents.toString()).slice(0, 8);
		var ext = path.extname(file.path);
		var filename = path.basename(file.path, ext) + '_' + hash + ext;
		var oldPath = file.path;
		file.path = path.join(path.dirname(file.path), filename);
		if (context) {
			context.put(oldPath, file.path);
		}
		cb(null, file);
	}).on('end', function() {
		if (context) {
			context.end();
		}
	});
};

module.exports.Context = require('./context');
