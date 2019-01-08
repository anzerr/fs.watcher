
const Watcher = require('./index.js'),
	path = require('path');

// let cwd = process.cwd();
let cwd = path.resolve('index.js');

new Watcher(cwd).on('change', (r) => {
	console.log('change', r);
});
