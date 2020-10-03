class BinaryStore {
	private _store: Record<string, Buffer | undefined> = {};

	create(key: string, buf?: Buffer) {
		this._store[key] = buf;
	}

	exists(key: string) {
		return key in this._store;
	}

	get(key: string) {
		return this._store[key];
	}

	override(key: string, buf: Buffer) {
		this._store[key] = buf;
	}

	append(key: string, buf: Buffer) {
		if (!this.exists(key))
			throw new Error(`binary store for ${key} doesn't exist`);

		if (this.get(key) === void 0) {
			this.override(key, buf);

			return;
		}

		this.override(key, Buffer.concat([this.get(key)!, buf]));

		console.log(this.get(key));
	}

	remove(key: string) {
		this._store[key] = void 0; // This is more efficient that delete!
	}
}

const binaryStore = new BinaryStore();

export default binaryStore;
