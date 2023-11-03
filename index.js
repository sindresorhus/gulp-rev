import {Buffer} from 'node:buffer';
import path from 'node:path';
import {vinylFile} from 'vinyl-file';
import revHash from 'rev-hash';
import {revPath} from 'rev-path';
import sortKeys from 'sort-keys';
import modifyFilename from 'modify-filename';
import Vinyl from 'vinyl';
import {gulpPlugin} from 'gulp-plugin-extras';

function relativePath(base, filePath) {
	filePath = filePath.replaceAll('\\', '/');
	base = base.replaceAll('\\', '/');

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

		filename = extIndex === -1
			? revPath(filename, file.revHash)
			: revPath(filename.slice(0, extIndex), file.revHash) + filename.slice(extIndex);

		return filename + extension;
	});
}

const getManifestFile = async options => {
	try {
		return await vinylFile(options.path, options);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return new Vinyl(options);
		}

		throw error;
	}
};

export default function gulpRev() {
	const sourcemaps = [];
	const pathMap = {};

	return gulpPlugin('gulp-rev', file => {
		// This is a sourcemap, hold until the end.
		if (path.extname(file.path) === '.map') {
			sourcemaps.push(file);
			return;
		}

		const oldPath = file.path;
		transformFilename(file);
		pathMap[oldPath] = file.revHash;

		return file;
	}, {
		async * onFinish() {
			for (const file of sourcemaps) {
				let reverseFilename;

				// Attempt to parse the sourcemap's JSON to get the reverse filename
				try {
					reverseFilename = JSON.parse(file.contents.toString()).file;
				} catch {}

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

				yield file;
			}
		},
	});
}

gulpRev.manifest = (path_, options) => {
	if (typeof path_ === 'string') {
		path_ = {path: path_};
	}

	options = {
		path: 'rev-manifest.json',
		merge: false,
		transformer: JSON,
		...options,
		...path_,
	};

	let manifest = {};

	return gulpPlugin('gulp-rev', file => {
		// Ignore all non-rev'd files
		if (!file.path || !file.revOrigPath) {
			return;
		}

		const revisionedFile = relativePath(path.resolve(file.cwd, file.base), path.resolve(file.cwd, file.path));
		const originalFile = path.join(path.dirname(revisionedFile), path.basename(file.revOrigPath)).replaceAll('\\', '/');

		manifest[originalFile] = revisionedFile;
	}, {
		async * onFinish() {
			// No need to write a manifest file if there's nothing to manifest
			if (Object.keys(manifest).length === 0) {
				return;
			}

			const manifestFile = await getManifestFile(options);

			if (options.merge && !manifestFile.isNull()) {
				let oldManifest = {};

				try {
					oldManifest = options.transformer.parse(manifestFile.contents.toString());
				} catch {}

				manifest = Object.assign(oldManifest, manifest);
			}

			manifestFile.contents = Buffer.from(options.transformer.stringify(sortKeys(manifest), undefined, '  '));

			yield manifestFile;
		},
	});
};
