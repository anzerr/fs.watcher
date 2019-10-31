
### `Intro`
![GitHub Actions status | linter](https://github.com/anzerr/fs.watcher/workflows/linter/badge.svg)
![GitHub Actions status | publish](https://github.com/anzerr/fs.watcher/workflows/publish/badge.svg)
![GitHub Actions status | test](https://github.com/anzerr/fs.watcher/workflows/test/badge.svg)

Watch a directory and emit when a change/add/remove has happened to a file or folder.

#### `Install`
``` bash
npm install --save git+https://github.com/anzerr/fs.watcher.git
npm install --save @anzerr/fs.watcher
```

### `Example`
``` javascript
const Watcher = require('fs.watcher');

let watch = new Watcher(process.cwd()).on('change', (r) => {
	console.log('change', r);
});
```