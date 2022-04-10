import handleLaunch from './launch';
import handleNest from './nest';

export default async function handleUrlEvent(url: string) {
	const parsed = new URL(url);

	switch (parsed.hostname) {
		case 'nest':
			return await handleNest(parsed);

		case 'launch':
			return await handleLaunch(parsed);

		default: return null;
	}
}
