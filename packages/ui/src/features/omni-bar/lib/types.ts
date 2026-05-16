import type { LucideIcon } from 'lucide-react';
import type { Dispatch } from 'redux';

export type OmniCategoryKey =
	| 'recents'
	| 'requests'
	| 'folders'
	| 'variableSets'
	| 'openTabs'
	| 'pages'
	| 'commands';

export interface OmniCategoryMeta {
	key: OmniCategoryKey;
	label: string;
	accent: string;
	scope?: string;
}

export interface OmniActionContext {
	dispatch: Dispatch;
}

export interface BaseOmniItem {
	id: string;
	category: OmniCategoryKey;
	title: string;
	subtitle?: string;
	keywords?: string[];
	icon: LucideIcon;
	accent?: string;
	badge?: { label: string; color: string };
	action: (ctx: OmniActionContext) => void;
	secondaryAction?: { label: string; run: (ctx: OmniActionContext) => void };
	weight?: number;
}

export interface OmniItem extends BaseOmniItem {}

export interface ScoredOmniItem {
	item: OmniItem;
	score: number;
}

export interface OmniGroup {
	categoryKey: OmniCategoryKey;
	items: OmniItem[];
}
