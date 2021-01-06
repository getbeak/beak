export function handleOpenUrl(openedUrl: string) {
	const url = new URL(openedUrl);

	switch (url.hostname) {
		case 'nest':
			return handleNest(url);

		default:
			return null;
	}
}

function handleNest(url: URL) {
	switch (url.pathname) {
		case '/magic-link': {
			const code = url.searchParams.get('code');
			const state = url.searchParams.get('state');

			if (!code || !state)
				return null;

			return { code, state };
		}

		default: return null;
	}
}
