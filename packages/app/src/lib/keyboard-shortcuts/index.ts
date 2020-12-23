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
	'project-explorer.folder.right';

const definitions: Record<Shortcuts, PlatformSpecificDefinitions | PlatformAgnosticDefinitions> = {
	'global.execute-request': {
		type: 'psd',
		windows: { shift: false, alt: false, meta: false, ctrl: true, key: 'Enter' },
		linux: { shift: false, alt: false, meta: false, ctrl: true, key: 'Enter' },
		darwin: { shift: false, alt: false, meta: true, ctrl: false, key: 'Enter' },
	},

	'project-explorer.request.up': { type: 'pad', shift: false, alt: false, meta: false, ctrl: false, key: 'ArrowUp' },
	'project-explorer.request.down': { type: 'pad', shift: false, alt: false, meta: false, ctrl: false, key: 'ArrowDown' },
	'project-explorer.request.left': { type: 'pad', shift: false, alt: false, meta: false, ctrl: false, key: 'ArrowLeft' },
	'project-explorer.request.rename': {
		type: 'psd',
		windows: { shift: false, alt: false, meta: false, ctrl: false, key: 'F2' },
		linux: { shift: false, alt: false, meta: false, ctrl: false, key: 'F2' },
		darwin: { shift: false, alt: false, meta: false, ctrl: false, key: 'Enter' },
	},
	'project-explorer.request.open': {
		type: 'psd',
		windows: { shift: false, alt: false, meta: false, ctrl: false, key: 'Enter' },
		linux: { shift: false, alt: false, meta: false, ctrl: false, key: 'Enter' },
		darwin: { shift: false, alt: false, meta: false, ctrl: false, key: 'ArrowRight' },
	},

	'project-explorer.folder.up': { type: 'pad', shift: false, alt: false, meta: false, ctrl: false, key: 'ArrowUp' },
	'project-explorer.folder.down': { type: 'pad', shift: false, alt: false, meta: false, ctrl: false, key: 'ArrowDown' },
	'project-explorer.folder.left': { type: 'pad', shift: false, alt: false, meta: false, ctrl: false, key: 'ArrowLeft' },
	'project-explorer.folder.right': { type: 'pad', shift: false, alt: false, meta: false, ctrl: false, key: 'ArrowRight' },
};

export function checkShortcut(shortcutKey: Shortcuts, event: React.KeyboardEvent | KeyboardEvent) {
	const { altKey, ctrlKey, metaKey, shiftKey, key } = event;
	const platformDefinition = definitions[shortcutKey];
	const shortcutDefinition = (() => {
		if (platformDefinition.type === 'pad')
			return platformDefinition;

		return platformDefinition[getPlatform()];
	})();

	/* eslint-disable operator-linebreak */
	return (
		shortcutDefinition.alt === altKey &&
		shortcutDefinition.ctrl === ctrlKey &&
		shortcutDefinition.meta === metaKey &&
		shortcutDefinition.shift === shiftKey &&
		shortcutDefinition.key === key
	);
	/* eslint-enable operator-linebreak */
}

export default definitions;
