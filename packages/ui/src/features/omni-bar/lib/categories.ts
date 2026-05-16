import type { OmniCategoryKey, OmniCategoryMeta } from './types';

export const CATEGORY_META: Record<OmniCategoryKey, OmniCategoryMeta> = {
	recents: { key: 'recents', label: 'Recent', accent: 'var(--beak-colors-accent-indigo)' },
	requests: { key: 'requests', label: 'Requests', accent: 'var(--beak-colors-accent-pink)' },
	folders: { key: 'folders', label: 'Folders', accent: 'var(--beak-colors-accent-teal)' },
	variableSets: { key: 'variableSets', label: 'Variable sets', accent: 'var(--beak-colors-accent-warning)' },
	openTabs: { key: 'openTabs', label: 'Open tabs', accent: 'var(--beak-colors-accent-indigo)' },
	pages: { key: 'pages', label: 'Pages', accent: 'var(--beak-colors-accent-info)' },
	commands: { key: 'commands', label: 'Commands', accent: 'var(--beak-colors-accent-success)' },
};

export const CATEGORY_ORDER: OmniCategoryKey[] = [
	'recents',
	'openTabs',
	'requests',
	'folders',
	'variableSets',
	'pages',
	'commands',
];
