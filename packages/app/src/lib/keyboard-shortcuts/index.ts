import { getPlatform } from '@beak/app/globals';

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

	'tab-bar.all.next' |
	'tab-bar.all.previous' |
	'tab-bar.all.close';

const definitions: Record<Shortcuts, PlatformSpecificDefinitions | PlatformAgnosticDefinitions> = {
	'global.execute-request': { type: 'agnostic', ctrlOrMeta: true, key: 'Enter' },

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
	'tab-bar.all.close': { type: 'agnostic', key: 'W' },
};

export function checkShortcut(shortcutKey: Shortcuts, event: React.KeyboardEvent | KeyboardEvent) {
	const { altKey, ctrlKey, metaKey, shiftKey, key } = event;
	const platformDefinition = definitions[shortcutKey];

	const shortcutDefinition = (() => {
		if (platformDefinition.type === 'agnostic')
			return platformDefinition;

		return platformDefinition[getPlatform()];
	})();

	/* eslint-disable operator-linebreak */
	return (
		Boolean(shortcutDefinition.alt) === altKey &&
		Boolean(shortcutDefinition.ctrl) === ctrlKey &&
		Boolean(shortcutDefinition.meta) === metaKey &&
		Boolean(shortcutDefinition.shift) === shiftKey &&
		shortcutDefinition.key === key
	);
	/* eslint-enable operator-linebreak */
}

export default definitions;
