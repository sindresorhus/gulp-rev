import Vinyl from 'vinyl';

export default function createFile({
	path,
	revOrigPath,
	revOrigBase,
	origName,
	revName,
	cwd,
	base,
	contents = ''
}) {
	const file = new Vinyl({
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
