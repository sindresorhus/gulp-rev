'use strict';
const path = require('path');
const through = require('through2');
const vinylFile = require('vinyl-file');
const revHash = require('rev-hash');
const revPath = require('rev-path');
const sortKeys = require('sort-keys');
const modifyFilename = require('modify-filename');
const Vinyl = require('vinyl');
const PluginError = require('plugin-error');

function relativePath(base, filePath) {
	filePath = filePath.replace(/\\/g, '/');
	base = base.replace(/\\/g, '/');

	if (!filePath.startsWith(base)) {
		return filePath;
	}

	const newPath = filePath.slice(base.length);

	if (newPath[0] === '/') {
		return newPath.slice(1);
	}

	return newPath;
}

function transformFilename(file) {
	// Save the old path for later
	file.revOrigPath = file.path;
	file.revOrigBase = file.base;
	file.revHash = revHash(file.contents);

	file.path = modifyFilename(file.path, (filename, extension) => {
		const extIndex = filename.lastIndexOf('.');

		filename = extIndex === -1 ?
			revPath(filename, file.revHash) :
			revPath(filename.slice(0, extIndex), file.revHash) + filename.slice(extIndex);

		return filename + extension;
	});
}

const getManifestFile = async options => {
	try {
		return await vinylFile.read(options.path, options);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return new Vinyl(options);
		}

		throw error;
	}
};

const plugin = () => {
	const sourcemaps = [];
	const pathMap = {};

	return through.obj((file, encoding, callback) => {
		if (file.isNull()) {
			callback(null, file);
			return;
		}

		if (file.isStream()) {
			callback(new PluginError('gulp-rev', 'Streaming not supported'));
			return;
		}

		// This is a sourcemap, hold until the end
		if (path.extname(file.path) === '.map') {
			sourcemaps.push(file);
			callback();
			return;
		}

		const oldPath = file.path;
		transformFilename(file);
		pathMap[oldPath] = file.revHash;

		callback(null, file);
	}, function (callback) {
		for (const file of sourcemaps) {
			let reverseFilename;

			// Attempt to parse the sourcemap's JSON to get the reverse filename
			try {
				reverseFilename = JSON.parse(file.contents.toString()).file;
			} catch (_) {}

			if (!reverseFilename) {
				reverseFilename = path.relative(path.dirname(file.path), path.basename(file.path, '.map'));
			}

			if (pathMap[reverseFilename]) {
				// Save the old path for later
				file.revOrigPath = file.path;
				file.revOrigBase = file.base;

				const hash = pathMap[reverseFilename];
				file.path = revPath(file.path.replace(/\.map$/, ''), hash) + '.map';
			} else {
				transformFilename(file);
			}

			this.push(file);
		}

		callback();
	});
};

plugin.manifest = (path_, options) => {
	if (typeof path_ === 'string') {
		path_ = {path: path_};
	}

	options = {
		path: 'rev-manifest.json',
		merge: false,
		transformer: JSON,
		...options,
		...path_
	};

	let manifest = {};

	return through.obj((file, encoding, callback) => {
		// Ignore all non-rev'd files
		if (!file.path || !file.revOrigPath) {
			callback();
			return;
		}

		const revisionedFile = relativePath(path.resolve(file.cwd, file.base), path.resolve(file.cwd, file.path));
		const originalFile = path.join(path.dirname(revisionedFile), path.basename(file.revOrigPath)).replace(/\\/g, '/');

		manifest[originalFile] = revisionedFile;

		callback();
	}, function (callback) {
		// No need to write a manifest file if there's nothing to manifest
		if (Object.keys(manifest).length === 0) {
			callback();
			return;
		}

		(async () => {
			try {
				const manifestFile = await getManifestFile(options);

				if (options.merge && !manifestFile.isNull()) {
					let oldManifest = {};

					try {
						oldManifest = options.transformer.parse(manifestFile.contents.toString());
					} catch (_) {}

					manifest = Object.assign(oldManifest, manifest);
				}

				manifestFile.contents = Buffer.from(options.transformer.stringify(sortKeys(manifest), undefined, '  '));
				this.push(manifestFile);
				callback();
			} catch (error) {
				callback(error);
			}
		})();
	});
};

module.exports = plugin;
