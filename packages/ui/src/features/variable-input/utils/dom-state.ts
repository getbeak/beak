import type { ValueSections } from '@beak/ui/features/variables/values';

/**
 * Convert a contenteditable element's child nodes back into our `ValueSections`
 * internal representation.
 *
 * Text/SPAN nodes become string parts; DIV nodes (the "tokens" the renderer
 * emits) become structured value parts using their `data-type` / `data-payload`
 * attributes. Anything else trips the anomaly flag, signalling that React
 * should re-render to recover known state.
 *
 * `onUrlQueryStringDetection` is invoked when a `?` is detected inline; the
 * `?` is stripped from the returned parts and the surrounding element is
 * blurred so the parent can route to the query editor.
 */
export interface ParseDomStateOptions {
	onUrlQueryStringDetection?: () => void;
	/** Called with the element so the caller can `.blur()` it on URL-query detection. */
	onQueryStringBlur?: () => void;
}

export interface ParseDomStateResult {
	valueParts: ValueSections;
	anomalyDetected: boolean;
}

export function parseDomState(root: HTMLElement | null, opts: ParseDomStateOptions = {}): ParseDomStateResult {
	if (!root) return { anomalyDetected: false, valueParts: [] };

	const reconciledParts: ValueSections = [];
	const children = root.childNodes;

	let anomalyDetected = false;

	Array.from(children).forEach(n => {
		// Simple text content (text node or SPAN).
		if (n.nodeName === '#text' || n.nodeName === 'SPAN') {
			// Normalize NBSPs to regular spaces.
			let originalTextContent = (n.textContent || '').replaceAll(/(?:[ ]+)/g, substring =>
				new Array(substring.length).fill(' ').join(''),
			);

			// Detect inline `?` — caller routes to the query editor.
			if (opts.onUrlQueryStringDetection && originalTextContent.includes('?')) {
				const textContext = originalTextContent.replaceAll('?', '');

				// eslint-disable-next-line no-param-reassign
				n.textContent = textContext;
				originalTextContent = textContext;

				opts.onUrlQueryStringDetection();
				opts.onQueryStringBlur?.();
			}

			reconciledParts.push(originalTextContent);
			return;
		}

		// Browser edge case: <br> from contenteditable.
		if (n.nodeName === 'BR') return;

		// Anything that isn't a token DIV is an anomaly.
		if (n.nodeName !== 'DIV') {
			// eslint-disable-next-line no-console
			console.error(`Unknown node detected in variable input ${n.nodeName}`);
			anomalyDetected = true;
			return;
		}

		const elem = n as HTMLElement;
		const type = elem.dataset.type!;
		const purePayload = elem.dataset.payload;

		reconciledParts.push({
			type,
			payload: purePayload ? JSON.parse(purePayload) : void 0,
		});
	});

	return { anomalyDetected, valueParts: reconciledParts };
}
