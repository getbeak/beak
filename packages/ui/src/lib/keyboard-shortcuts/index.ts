import React from 'react';
import { instance as windowSessionInstance } from '@beak/ui/contexts/window-session-context';

import { PlatformAgnosticDefinitions, PlatformSpecificDefinitions } from './types';

export type Shortcuts =
	| 'global.execute-request'

	| 'sidebar.toggle-view'
	| 'sidebar.switch-project'
	| 'sidebar.switch-variables'

	| 'tree-view.node.up'
	| 'tree-view.node.down'
	| 'tree-view.node.left'
	| 'tree-view.node.right'
	| 'tree-view.node.rename'
	| 'tree-view.node.delete'

	| 'variable-groups.variable-group.open'
	| 'variable-groups.variable-group.delete'

	| 'project-explorer.request.open'
	| 'project-explorer.request.duplicate'
	| 'project-explorer.item.delete'

	| 'omni-bar.launch.commands'
	| 'omni-bar.launch.finder'
	| 'omni-bar.commands.up'
	| 'omni-bar.commands.down'
	| 'omni-bar.commands.open'
	| 'omni-bar.finder.up'
	| 'omni-bar.finder.down'
	| 'omni-bar.finder.open'

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

	'variable-groups.variable-group.open': {
		type: 'specific',

		windows: { key: 'Enter' },
		linux: { key: 'Enter' },
		darwin: { meta: true, key: 'ArrowDown' },
	},
	'variable-groups.variable-group.delete': { type: 'agnostic', ctrlOrMeta: true, key: 'Backspace' },

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

	'omni-bar.commands.up': { type: 'agnostic', key: 'ArrowUp' },
	'omni-bar.commands.down': { type: 'agnostic', key: 'ArrowDown' },
	'omni-bar.commands.open': { type: 'agnostic', key: 'Enter' },

	'omni-bar.finder.up': { type: 'agnostic', key: 'ArrowUp' },
	'omni-bar.finder.down': { type: 'agnostic', key: 'ArrowDown' },
	'omni-bar.finder.open': { type: 'agnostic', key: 'Enter' },

	'tab-bar.all.next': { type: 'agnostic', ctrl: true, key: 'Tab' },
	'tab-bar.all.previous': { type: 'agnostic', ctrl: true, shift: true, key: 'Tab' },
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
		if (platformDefinition.type === 'agnostic')
			return platformDefinition;

		const platform = windowSessionInstance.getPlatform();

		if (platform === 'browser') return platformDefinition.darwin;

		return platformDefinition[platform];
	})();

	if (!shortcutDefinition) return false;

	if (shortcutDefinition.ctrlOrMeta) {
		const useMeta = windowSessionInstance.getPlatform() === 'darwin';
		const useCtrl = !useMeta;

		/* eslint-disable operator-linebreak */
		return (
			((useMeta && metaKey) || (useCtrl && ctrlKey)) &&
			Boolean(shortcutDefinition.alt) === altKey &&
			Boolean(shortcutDefinition.shift) === shiftKey &&
			(typeof shortcutDefinition.key === 'string' ? shortcutDefinition.key === key : shortcutDefinition.key.includes(modifiedKey))
		);
		/* eslint-enable operator-linebreak */
	}

	/* eslint-disable operator-linebreak */
	return (
		Boolean(shortcutDefinition.alt) === altKey &&
		Boolean(shortcutDefinition.ctrl) === ctrlKey &&
		Boolean(shortcutDefinition.meta) === metaKey &&
		Boolean(shortcutDefinition.shift) === shiftKey &&
		(typeof shortcutDefinition.key === 'string' ? shortcutDefinition.key === key : shortcutDefinition.key.includes(modifiedKey))
	);
	/* eslint-enable operator-linebreak */
}

export default shortcutDefinitions;
