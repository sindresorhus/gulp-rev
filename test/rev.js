import path from 'path';
import test from 'ava';
import pEvent from 'p-event';
import createFile from './_helper';
import rev from '..';

test('revs files', async t => {
	const stream = rev();
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn.css'
	}));

	const file = await data;
	t.is(file.path, 'unicorn-d41d8cd98f.css');
	t.is(file.revOrigPath, 'unicorn.css');
});

test('adds the revision hash before the first `.` in the filename', async t => {
	const stream = rev();
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn.css.map'
	}));

	const file = await data;
	t.is(file.path, 'unicorn-d41d8cd98f.css.map');
	t.is(file.revOrigPath, 'unicorn.css.map');
});

test('stores the hashes for later', async t => {
	const stream = rev();
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn.css'
	}));

	const file = await data;
	t.is(file.path, 'unicorn-d41d8cd98f.css');
	t.is(file.revOrigPath, 'unicorn.css');
	t.is(file.revHash, 'd41d8cd98f');
});

test.cb('handles sourcemaps transparently', t => {
	const stream = rev();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			t.is(file.path, path.normalize('maps/pastissada-d41d8cd98f.css.map'));
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

test.cb('handles unparseable sourcemaps correctly', t => {
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

test.cb('okay when the optional sourcemap.file is not defined', t => {
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

test('handles a `.` in the folder name', async t => {
	const stream = rev();
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'mysite.io/unicorn.css'
	}));

	const file = await data;
	t.is(file.path, path.normalize('mysite.io/unicorn-d41d8cd98f.css'));
	t.is(file.revOrigPath, path.normalize('mysite.io/unicorn.css'));
});
