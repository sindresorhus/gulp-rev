import path from 'path';
import test from 'ava';
import pEvent from 'p-event';
import createFile from './_helper';
import rev from '..';

const manifestFixture = './test.manifest-fixture.json';
const manifestFixturePath = path.join(__dirname, manifestFixture);
const manifestFixtureRelative = path.join('test', manifestFixture);

test('builds a rev manifest file', async t => {
	const stream = rev.manifest();
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));

	const file = await data;
	t.is(file.relative, 'rev-manifest.json');
	t.deepEqual(
		JSON.parse(file.contents.toString()),
		{'unicorn.css': 'unicorn-d41d8cd98f.css'}
	);
});

test('allows naming the manifest file', async t => {
	const path = 'manifest.json';
	const stream = rev.manifest({path});
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));

	const file = await data;
	t.is(file.relative, path);
});

test('appends to an existing rev manifest file', async t => {
	const stream = rev.manifest({
		path: manifestFixturePath,
		merge: true
	});
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));

	const file = await data;
	t.is(file.relative, manifestFixtureRelative);
	t.deepEqual(
		JSON.parse(file.contents.toString()),
		{
			'app.js': 'app-a41d8cd1.js',
			'unicorn.css': 'unicorn-d41d8cd98f.css'
		}
	);
});

test('does not append to an existing rev manifest by default', async t => {
	const stream = rev.manifest({path: manifestFixturePath});
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));

	const file = await data;
	t.is(file.relative, manifestFixtureRelative);
	t.deepEqual(
		JSON.parse(file.contents.toString()),
		{'unicorn.css': 'unicorn-d41d8cd98f.css'}
	);
});

test('sorts the rev manifest keys', async t => {
	const stream = rev.manifest({
		path: manifestFixturePath,
		merge: true
	});
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn-d41d8cd98f.css',
		revOrigPath: 'unicorn.css'
	}));
	stream.end(createFile({
		path: 'pony-d41d8cd98f.css',
		revOrigPath: 'pony.css'
	}));

	const file = await data;
	t.deepEqual(
		Object.keys(JSON.parse(file.contents.toString())),
		['app.js', 'pony.css', 'unicorn.css']
	);
});

test('respects directories', async t => {
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
	stream.end(createFile({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'bar', 'pony-d41d8cd98f.css'),
		revOrigBase: __dirname,
		revOrigPath: path.join(__dirname, 'bar', 'pony.css'),
		origName: 'pony.css',
		revName: 'pony-d41d8cd98f.css'
	}));

	const MANIFEST = {};
	MANIFEST['foo/unicorn.css'] = 'foo/unicorn-d41d8cd98f.css';
	MANIFEST['bar/pony.css'] = 'bar/pony-d41d8cd98f.css';

	const file = await data;
	t.is(file.relative, 'rev-manifest.json');
	t.deepEqual(JSON.parse(file.contents.toString()), MANIFEST);
});

test('respects files coming from directories with different bases', async t => {
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
	stream.end(createFile({
		cwd: __dirname,
		base: path.join(__dirname, 'output'),
		path: path.join(__dirname, 'output', 'bar', 'scriptbar-d41d8cd98f.js'),
		revOrigBase: path.join(__dirname, 'vendor2'),
		revOrigPath: path.join(__dirname, 'vendor2', 'bar', 'scriptbar.js'),
		origName: 'scriptfoo.js',
		revName: 'scriptfoo-d41d8cd98f.js'
	}));

	const MANIFEST = {};
	MANIFEST['foo/scriptfoo.js'] = 'foo/scriptfoo-d41d8cd98f.js';
	MANIFEST['bar/scriptbar.js'] = 'bar/scriptbar-d41d8cd98f.js';

	const file = await data;
	t.is(file.relative, 'rev-manifest.json');
	t.deepEqual(JSON.parse(file.contents.toString()), MANIFEST);
});

test('uses correct base path for each file', async t => {
	const stream = rev.manifest();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		cwd: 'app/',
		base: 'app/',
		path: path.join('app', 'foo', 'scriptfoo-d41d8cd98f.js'),
		revOrigPath: 'scriptfoo.js'
	}));
	stream.end(createFile({
		cwd: '/',
		base: 'assets/',
		path: path.join('/assets', 'bar', 'scriptbar-d41d8cd98f.js'),
		revOrigPath: 'scriptbar.js'
	}));

	const MANIFEST = {};
	MANIFEST['foo/scriptfoo.js'] = 'foo/scriptfoo-d41d8cd98f.js';
	MANIFEST['bar/scriptbar.js'] = 'bar/scriptbar-d41d8cd98f.js';

	const file = await data;
	t.deepEqual(JSON.parse(file.contents.toString()), MANIFEST);
});
