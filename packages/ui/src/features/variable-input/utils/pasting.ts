import sanitizeHtml, { IOptions } from 'sanitize-html';

const requiredDivAttributes = new Set([
	'class',
	'data-index',
	'data-type',
]);
const allowedDivAttributes = new Set([
	...Array.from(requiredDivAttributes),
	'contenteditable',
	'data-editable',
	'data-payload',
]);
const sanitizerOptions: IOptions = {
	allowedTags: ['div', 'span'],
	allowedAttributes: {
		div: Array.from(allowedDivAttributes),
		span: [],
	},
	exclusiveFilter: frame => {
		// Remove if true
		switch (frame.tag) {
			case 'div': {
				const attributeSet = new Set(Object.keys(frame.attribs));

				// Check element has all required attributes
				for (const r of requiredDivAttributes)
					if (!attributeSet.has(r)) return true;

				// Check element doesn't have any verboten attributes
				for (const r of attributeSet)
					if (!allowedDivAttributes.has(r)) return true;

				return false;
			}

			case 'span':
			case 'strong':
				return Object.keys(frame.attribs).length !== 0;

			default:
				return true;
		}
	},
};

export function handlePaste(event: ClipboardEvent) {
	event.preventDefault();

	if (!event.clipboardData)
		return;

	const plainText = event.clipboardData.getData('text/plain');
	const htmlText = event.clipboardData.getData('text/html');

	if (htmlText) {
		const sanitized = sanitizeHtml(htmlText, sanitizerOptions).replace(/[\r\n]+/g, '');

		if (sanitized) {
			document.execCommand('insertHtml', false, sanitized);

			return;
		}
	}

	if (plainText) {
		const sanitized = plainText.replace(/[\r\n]+/g, '');

		document.execCommand('insertText', false, sanitized);
	}
}
