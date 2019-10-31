
const path = require('path'),
	fs = require('fs.promisify'),
	promise = require('promise.util'),
	Think = require('think.library'),
	safe = require('./src/safe'),
	Hook = require('./src/hook.js');

class Watcher extends require('events') {

	constructor(home, exclude) {
		super();
		this._home = home;
		this._map = {};
		this._last = {};
		this.exclude = exclude;
		this.think = new Think(() => {
			return this.scan(this._home).then(() => {
				return (this._closed) ? this.close() : this.removed();
			});
		}, 500);
	}

	removed() {
		let p = Promise.resolve(), c = 0;
		for (let i in this._map) {
			((file) => {
				if (this._map[file] === null) {
					c++;
					return;
				}
				p = p.then(() => fs.access(file)).catch(() => {
					this._map[file].close();
					this._map[file] = null;
					this.emit('change', ['removed', file]);
				});
			})(i);
		}
		return p.then(() => {
			if (c > 100) {
				let o = {}, l = {};
				for (let i in this._map) {
					if (!this._map[i]) {
						o[i] = this._map[i];
						l[i] = this._last[i];
					}
				}
				this._last = l;
				this._map = o;
			}
		});
	}

	change(file) {
		if ((this._last[file] || 0) < Date.now() && this._map[file]) {
			this._last[file] = Date.now() + 100;
			this.emit('change', ['change', this._map[file].isDirectory, file]);
		}
	}

	hook(file) {
		if (!this._map[file] && (!this.exclude || this.exclude(file)) && !this._closed) {
			this._map[file] = new Hook(file);
			this._map[file].on('change', (r) => {
				if (r[0] === 'change') {
					this.change(r[2]);
				}
				if (r[0] === 'add' && this._map[file]) {
					this.emit('change', r);
				}
			});
			this._map[file].on('error', (err) => this.emit('error', err));
			return this._map[file].setup();
		}
		return Promise.resolve();
	}

	scan(dir) {
		if (this._closed) {
			return Promise.resolve();
		}
		return fs.stat(dir).then(async (res) => {
			if (res.isDirectory()) {
				return fs.readdir(dir).then((list) => {
					return promise.each(list, (r) => {
						const file = path.join(dir, r);
						return Promise.all([
							this.hook(file),
							this.scan(file)
						]);
					}, 5);
				});
			}
			return this.hook(dir);
		});
	}

	close() {
		console.log('close');
		this._closed = true;
		for (let i in this._map) {
			safe(() => {
				if (this._map[i]) {
					this._map[i].close();
				}
			});
		}
		safe(() => this.think.stop());
		return Promise.resolve();
	}

}

module.exports = Watcher;
