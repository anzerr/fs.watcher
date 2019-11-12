
const path = require('path'),
	safe = require('./safe'),
	fs = require('fs.promisify');

class Hook extends require('events') {

	constructor(file) {
		super();
		this._file = file;
		this._hook = setInterval(() => {
			safe(() => {
				if (this._watcher) {
					this._watcher.close();
				}
			});
			this.setup();
		}, 10 * 60 * 1000);
	}

	setup() {
		return fs.stat(this._file).then((res) => {
			let dir = res.isDirectory();
			this.isDirectory = dir;
			if (!dir) {
				this.directory = path.parse(this._file).dir;
				this.emit('change', ['add', dir, this._file, this.directory]);
			} else {
				this.directory = this._file;
			}
			if (this._watcher) {
				safe(() => this._watcher.close());
			}
			this._watcher = fs.watch(this._file, {recursive: true}, (eventType, filename) => {
				let file = (dir && filename) ? path.join(this._file, filename) : this._file;
				fs.stat(file).then(() => {
					this.emit('change', [eventType, dir, file, this.directory]);
				}).catch(() => {});
			});
			this._watcher.on('error', (err) => this.emit('error', err));
		});
	}

	close() {
		safe(() => {
			if (this._watcher) {
				this._watcher.close();
			}
		});
		clearInterval(this._hook);
	}

}

module.exports = Hook;
