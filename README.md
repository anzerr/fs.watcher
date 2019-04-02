
### `Intro`
Watch a directory and emit when a change/add/remove has happened to a file or folder

#### `Install`
``` bash
npm install --save git+https://git@github.com/anzerr/fs.watch.git
```

### `Example`
``` javascript
const Watcher = require('fs.watcher');

return new Watcher(process.cwd()).on('change', (r) => {
	console.log('change', r);
});
```