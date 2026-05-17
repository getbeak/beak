import Squawk from '@beak/common/utils/squawk';

/**
 * Fully-qualified variable type — the wire format both hosts encode +
 * the renderer reads. Format: `external:<package-name>/<variable-id>`.
 *
 * Both managers had their own copies of the parser; consolidated here so
 * the format lives in one place and a typo in either host fails fast
 * with a structured Squawk.
 */

export function makeFullyQualifiedType(packageName: string, variableId: string): string {
	return `external:${packageName}/${variableId}`;
}

export function packageNameFromType(type: string): string {
	if (!type.startsWith('external:')) throw new Squawk('not_an_external_variable_type', { type });
	const remainder = type.slice('external:'.length);
	const lastSlash = remainder.lastIndexOf('/');
	if (lastSlash === -1) return remainder;
	return remainder.slice(0, lastSlash);
}

export function variableIdFromType(type: string): string {
	if (!type.startsWith('external:')) throw new Squawk('not_an_external_variable_type', { type });
	const remainder = type.slice('external:'.length);
	const lastSlash = remainder.lastIndexOf('/');
	if (lastSlash === -1) return '';
	return remainder.slice(lastSlash + 1);
}
