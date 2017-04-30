import gutil from 'gulp-util';

function createFile({path, revOrigPath, revOrigBase, origName, revName, cwd, base, contents = ''}) {
	const file = new gutil.File({
		path,
		cwd,
		base,
		contents: Buffer.from(contents)
	});
	file.revOrigPath = revOrigPath;
	file.revOrigBase = revOrigBase;
	file.origName = origName;
	file.revName = revName;

	return file;
}

export default createFile;
