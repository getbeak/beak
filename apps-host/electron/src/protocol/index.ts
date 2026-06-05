import handleLaunch from './launch';

export default async function handleUrlEvent(url: string) {
	const parsed = new URL(url);

	switch (parsed.hostname) {
		case 'launch':
			return await handleLaunch(parsed);

		default:
			return null;
	}
}
