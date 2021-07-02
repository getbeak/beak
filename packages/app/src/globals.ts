import UAParser from 'ua-parser-js';

interface Globals {
	platform: null | NodeJS.Platform;
	windowId: null | string;
	version: null | string;
	os: string;
}

const globals: Globals = {
	windowId: null,
	platform: null,
	version: null,
	os: generateOS(),
};

function generateOS() {
	const ua = new UAParser(window.navigator.userAgent);
	const os = ua.getOS();

	return `${os.name}; ${os.version}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setGlobal(key: keyof typeof globals, value: any) {
	globals[key] = value;
}

export function getGlobal(key: keyof typeof globals) {
	return globals[key];
}

export function getPlatform() {
	const global = getGlobal('platform');

	if (global === 'darwin')
		return 'darwin';

	if (global === 'win32')
		return 'windows';

	// Fallback
	return 'linux';
}

export function isDarwin() {
	return getGlobal('platform') === 'darwin';
}
