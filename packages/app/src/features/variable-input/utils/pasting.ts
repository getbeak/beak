import sanitizeHtml, { IOptions } from 'sanitize-html';

const requiredDivAttributes = new Set(['class', 'contentditable', 'data-index', 'data-type', 'data-payload']);
const sanitizerOptions: IOptions = {
	allowedTags: ['div', 'span'],
	allowedAttributes: {
		div: Array.from(requiredDivAttributes),
		span: [],
	},
	exclusiveFilter: frame => {
		switch (frame.tag) {
			case 'div': {
				const attributeSet = new Set(Object.keys(frame.attribs));

				if (attributeSet.size !== requiredDivAttributes.size)
					return true;

				console.log(attributeSet);
				console.log(requiredDivAttributes);

				for (const r of requiredDivAttributes)
					if (!attributeSet.has(r)) return true;

				return false;
			}

			case 'span':
				return Object.keys(frame.attribs).length !== 0;

			default:
				return false;
		}
	},
};

export function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
	event.preventDefault();

	const plainText = event.clipboardData.getData('text/plain');
	const htmlText = event.clipboardData.getData('text/html');

	if (htmlText) {
		const sanitized = sanitizeHtml(htmlText, sanitizerOptions);

		document.execCommand('insertHtml', false, sanitized);
	} else if (plainText) {
		const sanitized = plainText.replace(/[\r\n]+/g, '');

		document.execCommand('insertText', false, sanitized);
	}
}
