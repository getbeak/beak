import { instance as windowSessionInstance } from '@beak/app/contexts/window-session-context';

import { PlatformAgnosticDefinitions, PlatformSpecificDefinitions } from './types';

type Shortcuts =
	'global.execute-request' |

	'project-explorer.request.up' |
	'project-explorer.request.down' |
	'project-explorer.request.left' |
	'project-explorer.request.open' |
	'project-explorer.request.rename' |

	'project-explorer.folder.up' |
	'project-explorer.folder.down' |
	'project-explorer.folder.left' |
	'project-explorer.folder.right' |

	'omni-bar.launch.commands' |
	'omni-bar.launch.finder' |
	'omni-bar.finder.up' |
	'omni-bar.finder.down' |
	'omni-bar.finder.open' |

	'tab-bar.all.next' |
	'tab-bar.all.previous' |
	'tab-bar.all.close';

const definitions: Record<Shortcuts, PlatformSpecificDefinitions | PlatformAgnosticDefinitions> = {
	'global.execute-request': {
		type: 'specific',

		windows: { ctrl: true, key: 'Enter' },
		linux: { ctrl: true, key: 'Enter' },
		darwin: { meta: true, key: ['Enter', 'R'] },
	},

	'project-explorer.request.up': { type: 'agnostic', key: 'ArrowUp' },
	'project-explorer.request.down': { type: 'agnostic', key: 'ArrowDown' },
	'project-explorer.request.left': { type: 'agnostic', key: 'ArrowLeft' },
	'project-explorer.request.rename': {
		type: 'specific',
		windows: { key: 'F2' },
		linux: { key: 'F2' },
		darwin: { key: 'Enter' },
	},
	'project-explorer.request.open': {
		type: 'specific',

		windows: { key: 'Enter' },
		linux: { key: 'Enter' },
		darwin: { key: 'ArrowRight' },
	},

	'project-explorer.folder.up': { type: 'agnostic', key: 'ArrowUp' },
	'project-explorer.folder.down': { type: 'agnostic', key: 'ArrowDown' },
	'project-explorer.folder.left': { type: 'agnostic', key: 'ArrowLeft' },
	'project-explorer.folder.right': { type: 'agnostic', key: 'ArrowRight' },

	'omni-bar.launch.commands': { type: 'agnostic', ctrlOrMeta: true, shift: true, key: 'p' },
	'omni-bar.launch.finder': { type: 'agnostic', ctrlOrMeta: true, key: ['p', 'k'] },

	'omni-bar.finder.up': { type: 'agnostic', key: 'ArrowUp' },
	'omni-bar.finder.down': { type: 'agnostic', key: 'ArrowDown' },
	'omni-bar.finder.open': { type: 'agnostic', key: 'Enter' },

	'tab-bar.all.next': {
		type: 'specific',
		windows: { ctrl: true, key: 'Tab' },
		linux: { ctrl: true, key: 'Tab' },
		darwin: { meta: true, alt: true, key: 'ArrowRight' },
	},
	'tab-bar.all.previous': {
		type: 'specific',
		windows: { ctrl: true, shift: true, key: 'Tab' },
		linux: { ctrl: true, shift: true, key: 'Tab' },
		darwin: { meta: true, alt: true, key: 'ArrowLeft' },
	},
	'tab-bar.all.close': { type: 'agnostic', ctrlOrMeta: true, key: 'w' },
};

export function checkShortcut(shortcutKey: Shortcuts, event: React.KeyboardEvent | KeyboardEvent) {
	const { altKey, ctrlKey, metaKey, shiftKey, key } = event;
	const platformDefinition = definitions[shortcutKey];

	const shortcutDefinition = (() => {
		if (platformDefinition.type === 'agnostic')
			return platformDefinition;

		return platformDefinition[windowSessionInstance.getPlatform()];
	})();

	if (shortcutDefinition.ctrlOrMeta) {
		const useMeta = windowSessionInstance.getPlatform() === 'darwin';
		const useCtrl = !useMeta;

		/* eslint-disable operator-linebreak */
		return (
			((useMeta && metaKey) || (useCtrl && ctrlKey)) &&
			Boolean(shortcutDefinition.alt) === altKey &&
			Boolean(shortcutDefinition.shift) === shiftKey &&
			(typeof shortcutDefinition.key === 'string' ? shortcutDefinition.key === key : shortcutDefinition.key.includes(key))
		);
		/* eslint-enable operator-linebreak */
	}

	/* eslint-disable operator-linebreak */
	return (
		Boolean(shortcutDefinition.alt) === altKey &&
		Boolean(shortcutDefinition.ctrl) === ctrlKey &&
		Boolean(shortcutDefinition.meta) === metaKey &&
		Boolean(shortcutDefinition.shift) === shiftKey &&
		(typeof shortcutDefinition.key === 'string' ? shortcutDefinition.key === key : shortcutDefinition.key.includes(key))
	);
	/* eslint-enable operator-linebreak */
}

export default definitions;
