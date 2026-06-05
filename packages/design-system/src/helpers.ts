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

/**
 * Canonical HTTP-verb → accent-colour map. Every surface that paints
 * a verb pill (request header, response header, tabs, omnibar, overview)
 * resolves through this so the same verb always wears the same colour.
 */
const VERB_COLOR_MAP: Record<string, string> = {
	get: 'var(--beak-colors-accent-teal)',
	post: 'var(--beak-colors-accent-pink)',
	put: 'var(--beak-colors-accent-indigo)',
	patch: 'var(--beak-colors-accent-indigo)',
	delete: 'var(--beak-colors-accent-alert)',
	head: 'var(--beak-colors-fg-muted)',
	options: 'var(--beak-colors-fg-muted)',
};

export function verbToColor(verb: string): string {
	return VERB_COLOR_MAP[verb.toLowerCase()] ?? 'var(--beak-colors-fg-muted)';
}

/**
 * Short verb labels for tight chrome (tab chips, omnibar rows).
 * `DEL`/`OPTS` truncate verbs whose full uppercase form crowds the chip.
 */
const VERB_LABEL_MAP: Record<string, string> = {
	get: 'GET',
	post: 'POST',
	put: 'PUT',
	patch: 'PATCH',
	delete: 'DEL',
	head: 'HEAD',
	options: 'OPTS',
};

export function verbToShortLabel(verb: string): string {
	return VERB_LABEL_MAP[verb.toLowerCase()] ?? verb.toUpperCase();
}
