const SAFE_KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function toJsPath(path: string[]): string {
	if (path.length === 0) return 'root';
	let out = 'root';
	for (const seg of path) {
		if (/^\d+$/.test(seg)) {
			out += `[${seg}]`;
		} else if (SAFE_KEY_RE.test(seg)) {
			out += `.${seg}`;
		} else {
			out += `[${JSON.stringify(seg)}]`;
		}
	}
	return out;
}

export function toJsonPointer(path: string[]): string {
	if (path.length === 0) return '';
	return path
		.map(s => s.replaceAll('~', '~0').replaceAll('/', '~1'))
		.map(s => `/${s}`)
		.join('');
}
