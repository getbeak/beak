import { useMemo } from 'react';

import { parseQuery, searchOmniItems } from '../lib/search';
import type { OmniGroup, OmniItem } from '../lib/types';

export interface OmniSearchResult {
	groups: OmniGroup[];
	flatItems: OmniItem[];
	scope: 'all' | 'commands' | 'recents';
}

export function useOmniSearch(items: OmniItem[], rawText: string): OmniSearchResult {
	return useMemo(() => {
		const query = parseQuery(rawText);
		const groups = searchOmniItems(items, query);
		const flatItems = groups.flatMap(g => g.items);
		return { groups, flatItems, scope: query.categoryScope };
	}, [items, rawText]);
}
