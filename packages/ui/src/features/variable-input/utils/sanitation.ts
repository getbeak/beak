import { ValueSections } from '@getbeak/types/values';

export function sanitiseValueSections(ValueSections: ValueSections) {
	// Now we need to slightly sanitise the reconciled state. The outcome of this must:
	// - Remove leading empty string parts
	// - Remove trailing empty string parts
	// - Collapse 2 or more consecutive empty string parts into one
	const sanitisedParts: ValueSections = ValueSections.reduce((acc, value) => {
		if (typeof value !== 'string')
			return [...acc, value];

		// Check if last item was a string too
		if (typeof acc[acc.length - 1] !== 'string')
			return [...acc, value];

		// eslint-disable-next-line no-param-reassign
		acc[acc.length - 1] = `${acc[acc.length - 1]}${value}`;

		return acc;
	}, [] as ValueSections);

	if (sanitisedParts[0] === '')
		sanitisedParts.shift();

	if (sanitisedParts[sanitisedParts.length - 1] === '')
		sanitisedParts.pop();

	return sanitisedParts;
}
