'use strict';
var crypto = require('crypto');
var path = require('path');
var map = require('map-stream');
var es = require('event-stream');

function md5(str) {
	return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

module.exports = function (context) {

	var fileEventStream = es.through();

	if (context) {
		fileEventStream.pipe(context);
	}

	return es.pipeline(
		map(function (file, cb) {
			var hash = md5(file.contents.toString()).slice(0, 8);
			var ext = path.extname(file.path);
			var filename = path.basename(file.path, ext) + '-' + hash + ext;
			var oldPath = file.relative;
			file.path = path.join(path.dirname(file.path), filename);
			fileEventStream.write({
				old: oldPath,
				new: file.relative
			});
			cb(null, file);
		}),
		es.through(null, function() {
			fileEventStream.end();
		})
	);

};

module.exports.Context = require('./context');
