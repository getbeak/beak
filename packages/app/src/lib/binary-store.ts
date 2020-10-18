class BinaryStore {
	private _store: Record<string, Buffer> = {};

	create(key: string, buf?: Buffer) {
		this._store[key] = buf || Buffer.alloc(0);
	}

	exists(key: string) {
		return key in this._store;
	}

	get(key: string) {
		return this._store[key];
	}

	set(key: string, buf: Buffer) {
		this._store[key] = buf;
	}

	append(key: string, buf: Buffer) {
		if (!this.exists(key))
			throw new Error(`binary store for ${key} doesn't exist`);

		if (this.get(key).length === 0) {
			this.set(key, buf);

			return;
		}

		const oldBuf = this.get(key);
		const newBuf = new Uint8Array(oldBuf.length + buf.length);

		newBuf.set(oldBuf);
		newBuf.set(buf, oldBuf.length);

		this.set(key, newBuf as Buffer);
	}

	remove(key: string) {
		delete this._store[key];
	}
}

const binaryStore = new BinaryStore();

export default binaryStore;
