import React from 'react';
import UAParser from 'ua-parser-js';

export class WindowSession {
	platform: NodeJS.Platform;
	windowId: string;
	version: string;
	os: string;

	constructor() {
		const params = new URLSearchParams(window.location.search);

		this.platform = params.get('platform')! as NodeJS.Platform;
		this.windowId = params.get('windowId')!;
		this.version = params.get('version')!;
		this.os = generateOS();
	}

	getPlatform() {
		if (this.platform === 'darwin')
			return 'darwin';

		if (this.platform === 'win32')
			return 'windows';

		// Fallback
		return 'linux';
	}

	isDarwin() {
		return this.platform === 'darwin';
	}
}

export const instance = new WindowSession();
const WindowSessionContext = React.createContext<WindowSession>(instance);

function generateOS() {
	const ua = new UAParser(window.navigator.userAgent);
	const os = ua.getOS();

	return `${os.name}; ${os.version}`;
}

export default WindowSessionContext;
