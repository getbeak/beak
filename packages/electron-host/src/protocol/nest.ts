import { createPortalWindow, windowStack } from '../window-management';

export default async function handleNest(url: URL) {
	switch (url.pathname) {
		case '/magic-link':
			return handleMagicLink(url);

		default: return null;
	}
}

function handleMagicLink(url: URL) {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state)
		return false;

	const windowId = createPortalWindow();
	const window = windowStack[windowId];

	window?.webContents.send('inbound_magic_link', { code, state });

	return true;
}
