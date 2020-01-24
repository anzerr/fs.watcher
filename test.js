
const Watcher = require('./index.js'),
	safe = require('./src/safe'),
	assert = require('assert'),
	{exec} = require('child_process'),
	mkdir = require('fs.mkdirp'),
	fs = require('fs.promisify'),
	remove = require('fs.remove'),
	key = require('unique.util'),
	path = require('path');

process.on('unhandledRejection', (err, prom) => {
	console.log('unhandledRejection', err, prom);
	process.exit(1);
});

const rand = () => key.random({length: 6});
const sleep = (n) => new Promise((resolve) => setTimeout(resolve, n));
const randomN = (n) => Math.floor(Math.random() * n);

let watcher = null;
const error = (err) => {
	console.log(err);
	safe(() => watcher.close());
	process.exit(1);
};
const cwd = path.join(process.cwd(), 'test');

const build = (n = 5) => {
	let p = Promise.resolve();
	for (let i = 0; i < n; i++) {
		p = p.then(() => {
			let f = path.join(cwd, [rand(), rand()].join('/'));
			return mkdir(f).then(() => f);
		}).then((f) => {
			let wait = [];
			for (let x = 0; x < n; x++) {
				wait.push(fs.writeFile(path.join(f, rand()), 'test'));
			}
			return Promise.all(wait);
		});
	}
	return p;
};

remove('test').then(() => {
	return build();
}).then(() => {
	let files = {}, count = 0, log = {removed: 0, change: 0};
	watcher = new Watcher(cwd).on('change', (r) => {
		if (!files[r[2]] && r[0] === 'add') {
			count += 1;
			files[r[2]] = r;
		}
		log[r[0]] = (log[r[0]] || 0) + 1;
	});
	watcher.on('error', () => {});
	const change = {removed: 0, change: 0};
	return sleep(1000).then(() => {
		assert.equal(count, 5 * 5);
		console.log('built folders', count);
		return build();
	}).then(() => {
		return sleep(1000);
	}).then(() => {
		assert.equal(count, 5 * 5 * 2);
		console.log('added more folders', count);
		let wait = [];
		log = {removed: 0, change: 0};
		for (let i in files) {
			if (randomN(100) % 2 === 0 && !files[i][1]) {
				change.change += 1;
				wait.push(fs.writeFile(i, (randomN(100) % 2 === 0) ? 'egg' : 'test'));
			} else {
				change.removed += 1;
				wait.push(remove(i));
			}
		}
		return Promise.all(wait);
	}).then(() => {
		return sleep(3000);
	}).then(() => {
		console.log(change, log);
		assert.equal(change.removed, log.removed);
		assert.equal((log.change > change.change), true);
		console.log('run write/remove changes', change);
		watcher.close();
		return new Promise((resolve) => {
			log = {};
			let last = null, done = false;
			watcher = new Watcher(process.cwd()).on('change', (r) => {
				log[r[0]] = (log[r[0]] || 0) + 1;
				clearTimeout(last);
				last = setTimeout(() => {
					done = true;
					resolve();
				}, 1000);
			});
			watcher.on('error', () => {});
		});
	}).then(() => {
		console.log('started second watcher');
		return remove('node_modules');
	}).then(() => {
		console.log('removed "node_modules" running "npm install"');
		return new Promise((resolve) => {
			exec('npm i', {cwd: __dirname}, (err, stdout, stderr) => {
				console.log(err, stdout, stderr);
				resolve();
			});
		});
	}).then(() => {
		console.log('npm done changes', log);
		safe(() => watcher.close());
		assert.equal((log.add > 500), true);
		assert.equal((log.removed > 500), true);
		process.exit(0);
	});
}).catch(error);
