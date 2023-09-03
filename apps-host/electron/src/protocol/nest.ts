import { createPortalWindow, windowStack } from '../window-management';

export default async function handleNest(url: URL) {
	switch (url.pathname) {
		case '/magic-link':
			return await handleMagicLink(url);

		default: return null;
	}
}

async function handleMagicLink(url: URL) {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state)
		return false;

	const windowId = await createPortalWindow();
	const window = windowStack[windowId];

	window?.webContents.send('inbound_magic_link', { code, state });

	return true;
}
