import Fuse, { type IFuseOptions } from 'fuse.js';

import { CATEGORY_ORDER } from './categories';
import type { OmniGroup, OmniItem } from './types';

const FUSE_OPTIONS: IFuseOptions<OmniItem> = {
	includeScore: true,
	ignoreLocation: true,
	threshold: 0.4,
	useExtendedSearch: false,
	keys: [
		{ name: 'title', weight: 0.6 },
		{ name: 'subtitle', weight: 0.2 },
		{ name: 'keywords', weight: 0.2 },
	],
};

export type OmniCategoryScope = 'all' | 'commands' | 'recents' | 'workflows';

export interface OmniQuery {
	rawText: string;
	queryText: string;
	categoryScope: OmniCategoryScope;
}

/**
 * Prefix-driven scope routing for the omni-bar input:
 *   `>foo` → command palette
 *   `~foo` → just recents + open tabs
 *   `#foo` → just workflows (mirrors the workflow tags pattern;
 *            also covers the user instinct of typing `#auth`)
 * Anything else is the "everything" scope.
 */
export function parseQuery(rawText: string): OmniQuery {
	const trimmed = rawText.trimStart();
	if (trimmed.startsWith('>')) return { rawText, queryText: trimmed.slice(1).trimStart(), categoryScope: 'commands' };
	if (trimmed.startsWith('~')) return { rawText, queryText: trimmed.slice(1).trimStart(), categoryScope: 'recents' };
	if (trimmed.startsWith('#')) return { rawText, queryText: trimmed.slice(1).trimStart(), categoryScope: 'workflows' };
	return { rawText, queryText: trimmed, categoryScope: 'all' };
}

const GROUP_LIMIT = 8;
const TOTAL_LIMIT = 50;

export function searchOmniItems(items: OmniItem[], query: OmniQuery): OmniGroup[] {
	const scoped = items.filter(item => {
		if (query.categoryScope === 'commands') return item.category === 'commands';
		if (query.categoryScope === 'recents') return item.category === 'recents' || item.category === 'openTabs';
		if (query.categoryScope === 'workflows') return item.category === 'workflows';
		return true;
	});

	if (!query.queryText) return groupAndOrder(scoped);

	const fuse = new Fuse(scoped, FUSE_OPTIONS);
	const results = fuse.search(query.queryText);
	const ranked = results.map(({ item, score }) => ({
		item,
		score: (score ?? 1) - (item.weight ?? 0) * 0.1,
	}));
	ranked.sort((a, b) => a.score - b.score);
	return groupAndOrder(ranked.slice(0, TOTAL_LIMIT).map(r => r.item));
}

function groupAndOrder(items: OmniItem[]): OmniGroup[] {
	const buckets = new Map<string, OmniItem[]>();
	for (const item of items) {
		const list = buckets.get(item.category) ?? [];
		if (list.length < GROUP_LIMIT) list.push(item);
		buckets.set(item.category, list);
	}

	const groups: OmniGroup[] = [];
	for (const key of CATEGORY_ORDER) {
		const list = buckets.get(key);
		if (!list || list.length === 0) continue;
		groups.push({ categoryKey: key, items: list });
	}
	return groups;
}
