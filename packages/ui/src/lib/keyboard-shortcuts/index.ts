import { instance as windowSessionInstance } from '@beak/ui/contexts/window-session-context';
import type React from 'react';

import type { PlatformAgnosticDefinitions, PlatformSpecificDefinitions } from './types';

export type Shortcuts =
	| 'global.execute-request'
	| 'sidebar.toggle-view'
	| 'sidebar.switch-project'
	| 'sidebar.switch-variables'
	| 'sidebar.switch-endpoints'
	| 'sidebar.switch-extensions'
	| 'tree-view.node.up'
	| 'tree-view.node.down'
	| 'tree-view.node.left'
	| 'tree-view.node.right'
	| 'tree-view.node.rename'
	| 'tree-view.node.delete'
	| 'variable-sets.variable-set.open'
	| 'variable-sets.variable-set.delete'
	| 'project-explorer.request.open'
	| 'project-explorer.request.duplicate'
	| 'project-explorer.item.delete'
	| 'omni-bar.launch.commands'
	| 'omni-bar.launch.finder'
	| 'omni-bar.launch.workflows'
	| 'tab-bar.all.next'
	| 'tab-bar.all.previous'
	| 'tab-bar.all.close'
	| 'tab-bar.all.close-others'
	| 'tab-bar.current.close'
	| 'menu-bar.file.new-request'
	| 'menu-bar.file.new-folder';

export const shortcutDefinitions: Record<Shortcuts, PlatformSpecificDefinitions | PlatformAgnosticDefinitions> = {
	'global.execute-request': {
		type: 'specific',

		windows: { ctrl: true, key: 'Enter' },
		linux: { ctrl: true, key: 'Enter' },
		darwin: { meta: true, key: ['Enter', 'R'] },
	},

	'sidebar.toggle-view': { type: 'agnostic', ctrlOrMeta: true, key: 'B' },
	'sidebar.switch-project': { type: 'agnostic', ctrlOrMeta: true, key: '1' },
	'sidebar.switch-variables': { type: 'agnostic', ctrlOrMeta: true, key: '2' },
	'sidebar.switch-endpoints': { type: 'agnostic', ctrlOrMeta: true, key: '3' },
	'sidebar.switch-extensions': { type: 'agnostic', ctrlOrMeta: true, key: '4' },

	'tree-view.node.up': { type: 'agnostic', key: 'ArrowUp' },
	'tree-view.node.down': { type: 'agnostic', key: 'ArrowDown' },
	'tree-view.node.left': { type: 'agnostic', key: 'ArrowLeft' },
	'tree-view.node.right': { type: 'agnostic', key: 'ArrowRight' },
	'tree-view.node.delete': { type: 'agnostic', ctrlOrMeta: true, key: 'Backspace' },
	'tree-view.node.rename': {
		type: 'specific',
		windows: { key: 'F2' },
		linux: { key: 'F2' },
		darwin: { key: 'Enter' },
	},

	'variable-sets.variable-set.open': {
		type: 'specific',

		windows: { key: 'Enter' },
		linux: { key: 'Enter' },
		darwin: { meta: true, key: 'ArrowDown' },
	},
	'variable-sets.variable-set.delete': { type: 'agnostic', ctrlOrMeta: true, key: 'Backspace' },

	'project-explorer.request.open': {
		type: 'specific',

		windows: { key: 'Enter' },
		linux: { key: 'Enter' },
		darwin: { meta: true, key: 'ArrowDown' },
	},
	'project-explorer.request.duplicate': { type: 'agnostic', ctrlOrMeta: true, key: 'D' },
	'project-explorer.item.delete': { type: 'agnostic', ctrlOrMeta: true, key: 'Backspace' },

	'omni-bar.launch.commands': { type: 'agnostic', ctrlOrMeta: true, shift: true, key: 'P' },
	'omni-bar.launch.finder': { type: 'agnostic', ctrlOrMeta: true, key: ['P', 'K'] },
	'omni-bar.launch.workflows': { type: 'agnostic', ctrlOrMeta: true, shift: true, key: 'O' },

	'tab-bar.all.next': {
		type: 'specific',
		darwin: { shift: true, key: 'Tab' },
		windows: { ctrl: true, key: 'Tab' },
		linux: { ctrl: true, key: 'Tab' },
	},
	'tab-bar.all.previous': {
		type: 'specific',
		darwin: { shift: true, key: 'ArrowUp' },
		windows: { ctrl: true, shift: true, key: 'Tab' },
		linux: { ctrl: true, shift: true, key: 'Tab' },
	},
	'tab-bar.all.close': { type: 'agnostic', ctrlOrMeta: true, key: 'W' },
	'tab-bar.all.close-others': { type: 'agnostic', ctrlOrMeta: true, alt: true, key: 'T' },
	'tab-bar.current.close': { type: 'agnostic', ctrlOrMeta: true, shift: true, key: 'W' },

	'menu-bar.file.new-request': { type: 'agnostic', ctrlOrMeta: true, shift: true, key: 'N' },
	'menu-bar.file.new-folder': { type: 'agnostic', ctrlOrMeta: true, alt: true, key: 'N' },
};

export function checkShortcut(shortcutKey: Shortcuts, event: React.KeyboardEvent | KeyboardEvent) {
	const { altKey, ctrlKey, metaKey, shiftKey, key } = event;
	const modifiedKey = key.length === 1 ? key.toLocaleUpperCase() : key;
	const platformDefinition = shortcutDefinitions[shortcutKey];

	const shortcutDefinition = (() => {
		if (platformDefinition.type === 'agnostic') return platformDefinition;

		const platform = windowSessionInstance.getPlatform();

		if (platform === 'browser') {
			// Web host: pick the keymap that matches the user's OS rather
			// than always darwin (the legacy default).
			return windowSessionInstance.isDarwin() ? platformDefinition.darwin : platformDefinition.windows;
		}

		return platformDefinition[platform];
	})();

	if (!shortcutDefinition) return false;

	// Single-letter `event.key` is the lower-cased character when Shift isn't
	// held ('b' for Cmd+B, 'd' for Cmd+D). The definitions all declare the
	// upper-case form, so compare against the same upper-cased version the
	// array path already uses — otherwise every single-letter ctrlOrMeta
	// shortcut silently misses on the web host's keydown path.
	const matchesKey = (defKey: string | string[]) =>
		typeof defKey === 'string' ? defKey === modifiedKey : defKey.includes(modifiedKey);

	if (shortcutDefinition.ctrlOrMeta) {
		const useMeta = windowSessionInstance.isDarwin();
		const useCtrl = !useMeta;

		return (
			((useMeta && metaKey) || (useCtrl && ctrlKey)) &&
			Boolean(shortcutDefinition.alt) === altKey &&
			Boolean(shortcutDefinition.shift) === shiftKey &&
			matchesKey(shortcutDefinition.key)
		);
	}

	return (
		Boolean(shortcutDefinition.alt) === altKey &&
		Boolean(shortcutDefinition.ctrl) === ctrlKey &&
		Boolean(shortcutDefinition.meta) === metaKey &&
		Boolean(shortcutDefinition.shift) === shiftKey &&
		matchesKey(shortcutDefinition.key)
	);
}

export default shortcutDefinitions;
