/**
 * Map an HTTP status code to a CSS colour string for status indicators.
 * Returns CSS variables that resolve through Chakra's theme tokens so the
 * caller doesn't need to subscribe to the active colour mode.
 */
export function statusToColor(status: number): string {
	switch (true) {
		case status >= 100 && status < 200:
			return 'var(--beak-colors-fg-muted)';
		case status >= 200 && status < 300:
			return 'var(--beak-colors-accent-teal)';
		case status >= 300 && status < 400:
			return 'orange';
		case status >= 400 && status < 500:
			return '#5B5B95';
		case status >= 500 && status < 600:
			return 'var(--beak-colors-accent-alert)';

		default:
			return 'pink';
	}
}
