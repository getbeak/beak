import React from 'react';
import UAParser from 'ua-parser-js';

export class WindowSession {
	platform: NodeJS.Platform | 'browser';
	windowId: string | null;
	version: string;
	os: string;

	constructor() {
		const params = new URLSearchParams(window.location.search);

		if (window.embeddedIndicator)
			this.platform = params.get('platform')! as NodeJS.Platform;
		else
			this.platform = 'browser';

		this.windowId = params.get('windowId');
		this.os = generateOS();

		// TODO(afr): Support web version
		this.version = params.get('version')! ?? '0.0.1';
	}

	getPlatform() {
		if (this.platform === 'darwin')
			return 'darwin';

		if (this.platform === 'win32')
			return 'windows';

		if (this.platform === 'browser')
			return 'browser';

		// Fallback
		return 'linux';
	}

	isDarwin() {
		return this.platform === 'darwin';
	}

	isBrowser() {
		return this.platform === 'browser';
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
