import { TypedObject } from '@beak/common/helpers/typescript';
import type { TabItem } from '@beak/common/types/beak-project';
import { verbToColor, verbToShortLabel } from '@beak/design-system/helpers';
import tabActions, { changeTab } from '@beak/ui/features/tabs/store/actions';
import { sidebarPreferenceSetCollapse, sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import type { FolderNode, Tree, ValidRequestNode } from '@getbeak/types/nodes';
import {
	BookOpen,
	Cookie,
	FileText,
	FlaskConical,
	Folder,
	Home,
	type LucideIcon,
	Settings,
	Sparkles,
	Table,
} from 'lucide-react';
import { useMemo } from 'react';

import { buildCommandRegistry } from '../lib/commands';
import type { OmniItem } from '../lib/types';

const PAGE_ITEMS: Array<{
	id: string;
	title: string;
	subtitle: string;
	icon: LucideIcon;
	tab: Parameters<typeof changeTab>[0];
	keywords?: string[];
}> = [
	{
		id: 'page:project_home',
		title: 'Project home',
		subtitle: 'Dashboard, OpenAPI sources',
		icon: Home,
		tab: { type: 'project_home', payload: 'project_home', temporary: false },
		keywords: ['dashboard'],
	},
	{
		id: 'page:getting_started',
		title: 'Getting started',
		subtitle: 'Intro and quick tips',
		icon: BookOpen,
		tab: { type: 'new_project_intro', payload: 'new_project_intro', temporary: false },
		keywords: ['welcome', 'intro'],
	},
	{
		id: 'page:preferences',
		title: 'Preferences',
		subtitle: 'Settings, theme, keybindings',
		icon: Settings,
		tab: { type: 'preferences', payload: 'preferences', temporary: false },
		keywords: ['settings', 'config'],
	},
	{
		id: 'page:cookie_jar',
		title: 'Cookies',
		subtitle: 'Inspect cookie jars per variable set',
		icon: Cookie,
		tab: { type: 'cookie_jar', payload: 'cookie_jar', temporary: false },
		keywords: ['jar', 'session', 'set-cookie'],
	},
	{
		id: 'page:variable_input_playground',
		title: 'Variable input lab',
		subtitle: 'Sandbox the value input — caret + selection scenarios',
		icon: FlaskConical,
		tab: {
			type: 'variable_input_playground',
			payload: 'variable_input_playground',
			temporary: false,
		},
		keywords: ['playground', 'sandbox', 'caret', 'selection', 'debug', 'lab'],
	},
];

function describeRequestPath(tree: Tree, node: ValidRequestNode): string {
	const chain: string[] = [];
	let cursor: { parent: string | null } = node;
	while (cursor.parent) {
		const parent = tree[cursor.parent] as FolderNode | undefined;
		if (!parent) break;
		chain.unshift(parent.name);
		cursor = parent;
	}
	return chain.join(' / ');
}

function describeFolderPath(tree: Tree, node: FolderNode): string {
	const chain: string[] = [];
	let cursor: { parent: string | null } = node;
	while (cursor.parent) {
		const parent = tree[cursor.parent] as FolderNode | undefined;
		if (!parent) break;
		chain.unshift(parent.name);
		cursor = parent;
	}
	return chain.join(' / ');
}

export function useOmniItems(): OmniItem[] {
	const tree = useAppSelector(s => s.global.project.tree) || ({} as Tree);
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const activeTabs = useAppSelector(s => s.features.tabs.activeTabs);
	const selectedTabId = useAppSelector(s => s.features.tabs.selectedTab);
	const sidebarCollapsed = useAppSelector(s => s.global.preferences.sidebar.collapsed.sidebar);

	return useMemo(() => {
		const items: OmniItem[] = [];
		const nodes = TypedObject.values(tree);

		const requests = nodes.filter(n => n.type === 'request' && n.mode === 'valid') as ValidRequestNode[];
		const folders = nodes.filter(n => n.type === 'folder') as FolderNode[];

		for (const req of requests) {
			const path = describeRequestPath(tree, req);
			const verb = (req.info?.verb ?? 'GET').toUpperCase();
			items.push({
				id: `request:${req.id}`,
				category: 'requests',
				title: req.name,
				subtitle: path || undefined,
				icon: FileText,
				keywords: [verb],
				badge: { label: verbToShortLabel(verb), color: verbToColor(verb) },
				accent: 'var(--beak-colors-accent-pink)',
				action: ({ dispatch }) => {
					dispatch(changeTab({ type: 'request', payload: req.id, temporary: true }));
				},
			});
		}

		for (const folder of folders) {
			const path = describeFolderPath(tree, folder);
			items.push({
				id: `folder:${folder.id}`,
				category: 'folders',
				title: folder.name,
				subtitle: path || undefined,
				icon: Folder,
				accent: 'var(--beak-colors-accent-teal)',
				action: ({ dispatch }) => {
					dispatch(sidebarPreferenceSetSelected('project'));
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
				},
			});
		}

		for (const setName of TypedObject.keys(variableSets ?? {})) {
			const set = variableSets[setName];
			if (!set) continue;
			const itemCount = TypedObject.keys(set.items ?? {}).length;
			items.push({
				id: `varset:${setName}`,
				category: 'variableSets',
				title: String(setName),
				subtitle: `${itemCount} variable${itemCount === 1 ? '' : 's'}`,
				icon: Table,
				accent: 'var(--beak-colors-accent-warning)',
				action: ({ dispatch }) => {
					dispatch(changeTab({ type: 'variable_set_editor', payload: String(setName), temporary: false }));
				},
			});
		}

		for (const tab of activeTabs) {
			if (tab.payload === selectedTabId) continue;
			const meta = describeTab(tab, tree, variableSets ? Object.keys(variableSets) : []);
			if (!meta) continue;
			items.push({
				id: `tab:${tab.type}:${String(tab.payload)}`,
				category: 'openTabs',
				title: meta.title,
				subtitle: meta.subtitle,
				icon: meta.icon,
				accent: 'var(--beak-colors-accent-indigo)',
				weight: 0.5,
				action: ({ dispatch }) => {
					dispatch(tabActions.changeTab({ ...tab, temporary: tab.temporary }));
				},
			});
		}

		for (const page of PAGE_ITEMS) {
			items.push({
				id: page.id,
				category: 'pages',
				title: page.title,
				subtitle: page.subtitle,
				icon: page.icon,
				keywords: page.keywords,
				accent: 'var(--beak-colors-accent-info)',
				action: ({ dispatch }) => {
					dispatch(changeTab(page.tab));
				},
			});
		}

		const commands = buildCommandRegistry({ sidebar: { collapsed: sidebarCollapsed } });
		for (const command of commands) {
			items.push({
				id: `command:${command.id}`,
				category: 'commands',
				title: command.name,
				subtitle: command.category,
				icon: command.icon,
				keywords: [...command.keywords, command.category],
				accent: 'var(--beak-colors-accent-success)',
				action: ({ dispatch }) => command.action(dispatch),
			});
		}

		const recentTab = activeTabs.find(t => t.payload === selectedTabId);
		if (recentTab) {
			const meta = describeTab(recentTab, tree, variableSets ? Object.keys(variableSets) : []);
			if (meta) {
				items.unshift({
					id: `recent:${recentTab.type}:${String(recentTab.payload)}`,
					category: 'recents',
					title: meta.title,
					subtitle: 'Currently open',
					icon: Sparkles,
					accent: 'var(--beak-colors-accent-indigo)',
					weight: 1,
					action: () => {},
				});
			}
		}

		return items;
	}, [tree, variableSets, activeTabs, selectedTabId, sidebarCollapsed]);
}

function describeTab(
	tab: TabItem,
	tree: Tree,
	_variableSetNames: string[],
): { title: string; subtitle: string; icon: LucideIcon } | null {
	switch (tab.type) {
		case 'request': {
			const node = tree[tab.payload];
			if (!node || node.type !== 'request') return null;
			return { title: node.name, subtitle: describeRequestPath(tree, node as ValidRequestNode), icon: FileText };
		}
		case 'variable_set_editor':
			return { title: String(tab.payload), subtitle: 'Variable set', icon: Table };
		case 'new_project_intro':
			return { title: 'Getting started', subtitle: 'Intro tab', icon: BookOpen };
		case 'preferences':
			return { title: 'Preferences', subtitle: 'Settings tab', icon: Settings };
		case 'project_home':
			return { title: 'Project home', subtitle: 'Dashboard tab', icon: Home };
		case 'variable_input_playground':
			return { title: 'Variable input lab', subtitle: 'Playground tab', icon: FlaskConical };
		default:
			return null;
	}
}
