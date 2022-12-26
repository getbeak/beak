import { instance as windowSessionInstance } from '../contexts/window-session-context';
import { ShortcutDefinition } from '../lib/keyboard-shortcuts/types';

export function renderPlainTextDefinition(definition: ShortcutDefinition) {
	const darwin = windowSessionInstance.isDarwin();
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
		parts.push(' ');
		definition.key.forEach(k => parts.push(k));
	} else {
		parts.push(renderSimpleKey(definition.key));
	}

	return parts.join('');
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