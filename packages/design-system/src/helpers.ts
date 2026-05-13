/**
 * Map an HTTP status code to a CSS colour for status indicators.
 *
 * Returns CSS variables that resolve through the design system's
 * numbered colour scales, so the caller doesn't need to subscribe to
 * the active colour mode.
 */
export function statusToColor(status: number): string {
	switch (true) {
		case status >= 100 && status < 200:
			// Informational — neutral muted grey.
			return 'var(--beak-colors-fg-muted)';
		case status >= 200 && status < 300:
			// Success — teal.500.
			return 'var(--beak-colors-teal-500)';
		case status >= 300 && status < 400:
			// Redirect — orange.500.
			return 'var(--beak-colors-orange-500)';
		case status >= 400 && status < 500:
			// Client error — yellow.500 (your request was wrong, not the server).
			return 'var(--beak-colors-yellow-500)';
		case status >= 500 && status < 600:
			// Server error — red.500 (full alert, server is broken).
			return 'var(--beak-colors-red-500)';

		default:
			return 'var(--beak-colors-pink-500)';
	}
}
