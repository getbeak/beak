class BinaryStore {
	private _store: Record<string, Uint8Array> = {};

	create(key: string, buf?: Uint8Array) {
		this._store[key] = buf || new Uint8Array(0);
	}

	exists(key: string) {
		return key in this._store;
	}

	get(key: string) {
		return this._store[key];
	}

	set(key: string, buf: Uint8Array) {
		this._store[key] = buf;
	}

	append(key: string, buf: Uint8Array) {
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

		this.set(key, newBuf as Uint8Array);
	}

	remove(key: string) {
		delete this._store[key];
	}
}

const binaryStore = new BinaryStore();

export default binaryStore;
