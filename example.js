const Watcher = require('./index.js');

return new Watcher(process.cwd()).on('change', (r) => {
	console.log('change', r);
});
