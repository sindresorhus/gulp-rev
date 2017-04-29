import path from 'path';
import test from 'ava';
import pEvent from 'p-event';
import gutil from 'gulp-util';
import rev from './';

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

test('should rev files', async t => {
	const stream = rev();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn.css'
	}));
	stream.end();

	const file = await data;
	t.is(file.path, 'unicorn-d41d8cd98f.css');
	t.is(file.revOrigPath, 'unicorn.css');
});

test('should add the revision hash before the first `.` in the filename', async t => {
	const stream = rev();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn.css.map'
	}));
	stream.end();

	const file = await data;
	t.is(file.path, 'unicorn-d41d8cd98f.css.map');
	t.is(file.revOrigPath, 'unicorn.css.map');
});

test('should build a rev manifest file', async t => {
	const stream = rev.manifest();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));
	stream.end();

	const file = await data;
	t.is(file.relative, 'rev-manifest.json');
	t.deepEqual(
		JSON.parse(file.contents.toString()),
		{'unicorn.css': 'unicorn-d41d8cd98f.css'}
	);
});

test('should allow naming the manifest file', async t => {
	const path = 'manifest.json';
	const stream = rev.manifest({path});
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));
	stream.end();

	const file = await data;
	t.is(file.relative, path);
});

test('should append to an existing rev manifest file', async t => {
	const stream = rev.manifest({
		path: 'test.manifest-fixture.json',
		merge: true
	});
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));
	stream.end();

	const file = await data;
	t.is(file.relative, 'test.manifest-fixture.json');
	t.deepEqual(
		JSON.parse(file.contents.toString()),
		{
			'app.js': 'app-a41d8cd1.js',
			'unicorn.css': 'unicorn-d41d8cd98f.css'
		}
	);
});

test('should not append to an existing rev manifest by default', async t => {
	const stream = rev.manifest({path: 'test.manifest-fixture.json'});
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));
	stream.end();

	const file = await data;
	t.is(file.relative, 'test.manifest-fixture.json');
	t.deepEqual(
		JSON.parse(file.contents.toString()),
		{'unicorn.css': 'unicorn-d41d8cd98f.css'}
	);
});

test('should sort the rev manifest keys', async t => {
	const stream = rev.manifest({
		path: 'test.manifest-fixture.json',
		merge: true
	});
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));
	stream.write(createFile({
		path: 'pony-d41d8cd98f.css',
		revOrigPath: 'pony.css'
	}));
	stream.end();

	const file = await data;
	t.deepEqual(
		Object.keys(JSON.parse(file.contents.toString())),
		['app.js', 'pony.css', 'unicorn.css']
	);
});

test('should respect directories', async t => {
	const stream = rev.manifest();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'foo', 'unicorn-d41d8cd98f.css'),
		revOrigPath: path.join(__dirname, 'foo', 'unicorn.css'),
		revOrigBase: __dirname,
		origName: 'unicorn.css',
		revName: 'unicorn-d41d8cd98f.css'
	}));
	stream.write(createFile({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'bar', 'pony-d41d8cd98f.css'),
		revOrigBase: __dirname,
		revOrigPath: path.join(__dirname, 'bar', 'pony.css'),
		origName: 'pony.css',
		revName: 'pony-d41d8cd98f.css'
	}));
	stream.end();

	const MANIFEST = {};
	MANIFEST[path.join('foo', 'unicorn.css')] = path.join('foo', 'unicorn-d41d8cd98f.css');
	MANIFEST[path.join('bar', 'pony.css')] = path.join('bar', 'pony-d41d8cd98f.css');

	const file = await data;
	t.is(file.relative, 'rev-manifest.json');
	t.deepEqual(JSON.parse(file.contents.toString()), MANIFEST);
});

test('should respect files coming from directories with different bases', async t => {
	const stream = rev.manifest();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		cwd: __dirname,
		base: path.join(__dirname, 'output'),
		path: path.join(__dirname, 'output', 'foo', 'scriptfoo-d41d8cd98f.js'),
		contents: Buffer.from(''),
		revOrigBase: path.join(__dirname, 'vendor1'),
		revOrigPath: path.join(__dirname, 'vendor1', 'foo', 'scriptfoo.js'),
		origName: 'scriptfoo.js',
		revName: 'scriptfoo-d41d8cd98f.js'
	}));
	stream.write(createFile({
		cwd: __dirname,
		base: path.join(__dirname, 'output'),
		path: path.join(__dirname, 'output', 'bar', 'scriptbar-d41d8cd98f.js'),
		revOrigBase: path.join(__dirname, 'vendor2'),
		revOrigPath: path.join(__dirname, 'vendor2', 'bar', 'scriptbar.js'),
		origName: 'scriptfoo.js',
		revName: 'scriptfoo-d41d8cd98f.js'
	}));
	stream.end();

	const MANIFEST = {};
	MANIFEST[path.join('foo', 'scriptfoo.js')] = path.join('foo', 'scriptfoo-d41d8cd98f.js');
	MANIFEST[path.join('bar', 'scriptbar.js')] = path.join('bar', 'scriptbar-d41d8cd98f.js');

	const file = await data;
	t.is(file.relative, 'rev-manifest.json');
	t.deepEqual(JSON.parse(file.contents.toString()), MANIFEST);
});

test('should store the hashes for later', async t => {
	const stream = rev();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn.css'
	}));

	const file = await data;
	t.is(file.path, 'unicorn-d41d8cd98f.css');
	t.is(file.revOrigPath, 'unicorn.css');
	t.is(file.revHash, 'd41d8cd98f');
});

test.cb('should handle sourcemaps transparently', t => {
	const stream = rev();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			t.is(file.path, 'maps/pastissada-d41d8cd98f.css.map');
			t.end();
		}
	});

	stream.write(createFile({
		path: 'pastissada.css'
	}));

	stream.end(createFile({
		path: 'maps/pastissada.css.map',
		contents: JSON.stringify({file: 'pastissada.css'})
	}));
});

test.cb('should handle unparseable sourcemaps correctly', t => {
	const stream = rev();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			t.is(file.path, 'pastissada-d41d8cd98f.css.map');
			t.end();
		}
	});

	stream.write(createFile({
		path: 'pastissada.css'
	}));

	stream.end(createFile({
		path: 'pastissada.css.map',
		contents: 'Wait a minute, this is invalid JSON!'
	}));
});

test.cb('should be okay when the optional sourcemap.file is not defined', t => {
	const stream = rev();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			t.is(file.path, 'pastissada-d41d8cd98f.css.map');
			t.end();
		}
	});

	stream.write(createFile({
		path: 'pastissada.css'
	}));

	stream.end(createFile({
		path: 'pastissada.css.map',
		contents: JSON.stringify({})
	}));
});

test('should handle a . in the folder name', async t => {
	const stream = rev();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'mysite.io/unicorn.css'
	}));

	const file = await data;
	t.is(file.path, 'mysite.io/unicorn-d41d8cd98f.css');
	t.is(file.revOrigPath, 'mysite.io/unicorn.css');
});

test('should use correct base path for each file', async t => {
	const stream = rev.manifest();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		cwd: 'app/',
		base: 'app/',
		path: path.join('app', 'foo', 'scriptfoo-d41d8cd98f.js'),
		revOrigPath: 'scriptfoo.js'
	}));
	stream.write(createFile({
		cwd: 'assets/',
		base: 'assets/',
		path: path.join('assets', 'bar', 'scriptbar-d41d8cd98f.js'),
		revOrigPath: 'scriptbar.js'
	}));
	stream.end();

	const MANIFEST = {};
	MANIFEST[path.join('foo', 'scriptfoo.js')] = path.join('foo', 'scriptfoo-d41d8cd98f.js');
	MANIFEST[path.join('bar', 'scriptbar.js')] = path.join('bar', 'scriptbar-d41d8cd98f.js');

	const file = await data;
	t.deepEqual(JSON.parse(file.contents.toString()), MANIFEST);
});
