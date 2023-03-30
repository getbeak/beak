export function ssgSafeBeakHost() {
	if (typeof window === 'undefined')
		return 'https://getbeak.app';

	return window.location.host;
}
