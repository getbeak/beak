import { instance as windowSessionInstance } from '../contexts/window-session-context';
import shortcutDefinitions, { Shortcuts } from '../lib/keyboard-shortcuts';
import { PlatformAgnosticDefinitions, PlatformSpecificDefinitions } from '../lib/keyboard-shortcuts/types';

function selectDefinition(platformDefinition: PlatformSpecificDefinitions | PlatformAgnosticDefinitions) {
	if (platformDefinition.type === 'agnostic') return platformDefinition;

	const isDarwin = windowSessionInstance.isDarwin();

	if (isDarwin) return platformDefinition.darwin;

	return platformDefinition.windows;
}

export function renderAcceleratorDefinition(shortcutKey: Shortcuts) {
	const definition = selectDefinition(shortcutDefinitions[shortcutKey]);
	const parts: string[] = [];

	if (definition.ctrlOrMeta) parts.push('CmdOrCtrl');
	if (definition.alt) parts.push('Alt');
	if (definition.ctrl) parts.push('Ctrl');
	if (definition.shift) parts.push('Shift');
	if (definition.meta) parts.push('Meta');

	if (Array.isArray(definition.key))
		parts.push(definition.key[0]);
	else
		parts.push(definition.key);

	return parts.join('+');
}

export function renderPlainTextDefinition(shortcutKey: Shortcuts) {
	const darwin = windowSessionInstance.isDarwin();
	const definition = selectDefinition(shortcutDefinitions[shortcutKey]);
	const parts: string[] = [];

	if (definition.ctrlOrMeta) {
		if (darwin === void 0)
			parts.push('⌘');
		else
			parts.push(renderPlatformAwareCtrlOrMeta(darwin));
	}

	if (definition.ctrl) parts.push('⌃');
	if (definition.alt) parts.push('⌥');
	if (definition.meta) parts.push('⌘');
	if (definition.shift) parts.push('⇧');

	if (Array.isArray(definition.key)) {
		const shortcutOptions: string[] = [];

		definition.key.forEach(k => {
			const partsClone = [...parts, k.toLocaleUpperCase()];

			shortcutOptions.push(partsClone.join(' '));
		});

		return shortcutOptions.join(', ');
	}

	parts.push(renderSimpleKey(definition.key.toLocaleUpperCase()));

	return parts.join(' ');
}

export function renderPlatformAwareCtrlOrMeta(darwin: boolean) {
	if (darwin)
		return '⌘';

	return '⌃';
}

export function renderSimpleKey(key: string) {
	if (key.length === 1)
		return key.toUpperCase();

	switch (key) {
		case 'ArrowUp': return '↑';
		case 'ArrowDown': return '↓';

		default: return key;
	}
}
