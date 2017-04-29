import path from 'path';
import test from 'ava';
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

test.cb('should rev files', t => {
	const stream = rev();

	stream.on('data', file => {
		t.is(file.path, 'unicorn-d41d8cd98f.css');
		t.is(file.revOrigPath, 'unicorn.css');
		t.end();
	});

	stream.write(createFile({
		path: 'unicorn.css'
	}));
});

test.cb('should add the revision hash before the first `.` in the filename', t => {
	const stream = rev();

	stream.on('data', file => {
		t.is(file.path, 'unicorn-d41d8cd98f.css.map');
		t.is(file.revOrigPath, 'unicorn.css.map');
		t.end();
	});

	stream.write(createFile({
		path: 'unicorn.css.map'
	}));

	stream.end();
});

test.cb('should build a rev manifest file', t => {
	const stream = rev.manifest();

	stream.on('data', newFile => {
		t.is(newFile.relative, 'rev-manifest.json');
		t.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{'unicorn.css': 'unicorn-d41d8cd98f.css'}
		);
		t.end();
	});

	const file = createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	});

	stream.write(file);
	stream.end();
});

test.cb('should allow naming the manifest file', t => {
	const path = 'manifest.json';
	const stream = rev.manifest({path});

	stream.on('data', newFile => {
		t.is(newFile.relative, path);
		t.end();
	});

	const file = createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	});

	stream.write(file);
	stream.end();
});

test.cb('should append to an existing rev manifest file', t => {
	const stream = rev.manifest({
		path: 'test.manifest-fixture.json',
		merge: true
	});

	stream.on('data', newFile => {
		t.is(newFile.relative, 'test.manifest-fixture.json');
		t.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{
				'app.js': 'app-a41d8cd1.js',
				'unicorn.css': 'unicorn-d41d8cd98f.css'
			}
		);
		t.end();
	});

	const file = createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	});

	stream.write(file);
	stream.end();
});

test.cb('should not append to an existing rev manifest by default', t => {
	const stream = rev.manifest({path: 'test.manifest-fixture.json'});

	stream.on('data', newFile => {
		t.is(newFile.relative, 'test.manifest-fixture.json');
		t.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{'unicorn.css': 'unicorn-d41d8cd98f.css'}
		);
		t.end();
	});

	const file = createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	});

	stream.write(file);
	stream.end();
});

test.cb('should sort the rev manifest keys', t => {
	const stream = rev.manifest({
		path: 'test.manifest-fixture.json',
		merge: true
	});

	stream.on('data', newFile => {
		t.deepEqual(
			Object.keys(JSON.parse(newFile.contents.toString())),
			['app.js', 'pony.css', 'unicorn.css']
		);
		t.end();
	});

	const file = createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	});

	const fileTwo = createFile({
		path: 'pony-d41d8cd98f.css',
		revOrigPath: 'pony.css'
	});

	stream.write(file);
	stream.write(fileTwo);
	stream.end();
});

test.cb('should respect directories', t => {
	const stream = rev.manifest();

	stream.on('data', newFile => {
		const MANIFEST = {};
		MANIFEST[path.join('foo', 'unicorn.css')] = path.join('foo', 'unicorn-d41d8cd98f.css');
		MANIFEST[path.join('bar', 'pony.css')] = path.join('bar', 'pony-d41d8cd98f.css');

		t.is(newFile.relative, 'rev-manifest.json');
		t.deepEqual(JSON.parse(newFile.contents.toString()), MANIFEST);
		t.end();
	});

	const file1 = createFile({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'foo', 'unicorn-d41d8cd98f.css'),
		revOrigPath: path.join(__dirname, 'foo', 'unicorn.css'),
		revOrigBase: __dirname,
		origName: 'unicorn.css',
		revName: 'unicorn-d41d8cd98f.css'
	});

	const file2 = createFile({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'bar', 'pony-d41d8cd98f.css'),
		revOrigBase: __dirname,
		revOrigPath: path.join(__dirname, 'bar', 'pony.css'),
		origName: 'pony.css',
		revName: 'pony-d41d8cd98f.css'
	});

	stream.write(file1);
	stream.write(file2);
	stream.end();
});

test.cb('should respect files coming from directories with different bases', t => {
	const stream = rev.manifest();

	stream.on('data', newFile => {
		const MANIFEST = {};
		MANIFEST[path.join('foo', 'scriptfoo.js')] = path.join('foo', 'scriptfoo-d41d8cd98f.js');
		MANIFEST[path.join('bar', 'scriptbar.js')] = path.join('bar', 'scriptbar-d41d8cd98f.js');

		t.is(newFile.relative, 'rev-manifest.json');
		t.deepEqual(JSON.parse(newFile.contents.toString()), MANIFEST);
		t.end();
	});

	const file1 = createFile({
		cwd: __dirname,
		base: path.join(__dirname, 'output'),
		path: path.join(__dirname, 'output', 'foo', 'scriptfoo-d41d8cd98f.js'),
		contents: Buffer.from(''),
		revOrigBase: path.join(__dirname, 'vendor1'),
		revOrigPath: path.join(__dirname, 'vendor1', 'foo', 'scriptfoo.js'),
		origName: 'scriptfoo.js',
		revName: 'scriptfoo-d41d8cd98f.js'
	});

	const file2 = createFile({
		cwd: __dirname,
		base: path.join(__dirname, 'output'),
		path: path.join(__dirname, 'output', 'bar', 'scriptbar-d41d8cd98f.js'),
		revOrigBase: path.join(__dirname, 'vendor2'),
		revOrigPath: path.join(__dirname, 'vendor2', 'bar', 'scriptbar.js'),
		origName: 'scriptfoo.js',
		revName: 'scriptfoo-d41d8cd98f.js'
	});

	stream.write(file1);
	stream.write(file2);
	stream.end();
});

test.cb('should store the hashes for later', t => {
	const stream = rev();

	stream.on('data', file => {
		t.is(file.path, 'unicorn-d41d8cd98f.css');
		t.is(file.revOrigPath, 'unicorn.css');
		t.is(file.revHash, 'd41d8cd98f');
		t.end();
	});

	stream.write(createFile({
		path: 'unicorn.css'
	}));
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

test.cb('should handle a . in the folder name', t => {
	const stream = rev();

	stream.on('data', file => {
		t.is(file.path, 'mysite.io/unicorn-d41d8cd98f.css');
		t.is(file.revOrigPath, 'mysite.io/unicorn.css');
		t.end();
	});

	stream.write(createFile({
		path: 'mysite.io/unicorn.css'
	}));
});

test.cb('should use correct base path for each file', t => {
	const stream = rev.manifest();

	stream.on('data', newFile => {
		const MANIFEST = {};
		MANIFEST[path.join('foo', 'scriptfoo.js')] = path.join('foo', 'scriptfoo-d41d8cd98f.js');
		MANIFEST[path.join('bar', 'scriptbar.js')] = path.join('bar', 'scriptbar-d41d8cd98f.js');

		t.deepEqual(JSON.parse(newFile.contents.toString()), MANIFEST);
		t.end();
	});

	const fileFoo = createFile({
		cwd: 'app/',
		base: 'app/',
		path: path.join('app', 'foo', 'scriptfoo-d41d8cd98f.js'),
		revOrigPath: 'scriptfoo.js'
	});

	const fileBar = createFile({
		cwd: 'assets/',
		base: 'assets/',
		path: path.join('assets', 'bar', 'scriptbar-d41d8cd98f.js'),
		revOrigPath: 'scriptbar.js'
	});

	stream.write(fileFoo);
	stream.write(fileBar);
	stream.end();
});
