export class LocalStorage {
	private readonly prefix: string;

	constructor(prefix: string) {
		this.prefix = prefix;
	}

	private generateKey(key: string): string {
		return `${this.prefix}.${key}`;
	}

	getJsonItem<T>(key: string) {
		const value = window.localStorage.getItem(this.generateKey(key));

		if (!value)
			return null;

		return JSON.parse(value) as T;
	}

	setJsonItem<T>(key: string, value: T): void {
		window.localStorage.setItem(this.generateKey(key), JSON.stringify(value));
	}

	remove(key: string): void {
		window.localStorage.removeItem(this.generateKey(key));
	}
}
