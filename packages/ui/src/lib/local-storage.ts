export class LocalStorage {
	private readonly prefix: string;

	constructor(prefix: string) {
		this.prefix = prefix;
	}

	private generateKey(key: string): string {
		return `${this.prefix}.${key}`;
	}

	getJsonItem<T>(key: string) {
		const fullKey = this.generateKey(key);
		const value = window.localStorage.getItem(fullKey);

		if (!value) return null;

		try {
			return JSON.parse(value) as T;
		} catch (err) {
			// Corrupted entry — drop it so the next session starts clean instead
			// of crashing every load with the same bad blob.
			console.warn(`localStorage.${fullKey} contained invalid JSON; dropping`, err);
			window.localStorage.removeItem(fullKey);
			return null;
		}
	}

	setJsonItem<T>(key: string, value: T): void {
		window.localStorage.setItem(this.generateKey(key), JSON.stringify(value));
	}

	remove(key: string): void {
		window.localStorage.removeItem(this.generateKey(key));
	}
}
