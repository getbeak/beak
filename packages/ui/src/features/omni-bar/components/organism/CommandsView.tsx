import { Box, Flex } from '@chakra-ui/react';
import tabActions from '@beak/ui/features/tabs/store/actions';
import { ipcExplorerService, ipcPreferencesService, ipcWindowService } from '@beak/ui/lib/ipc';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { reloadExtensions } from '@beak/ui/store/extensions/actions';
import { sidebarPreferenceSetCollapse, sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { movePosition } from '@beak/ui/utils/arrays';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import {
	ArrowLeft,
	ArrowRight,
	Bug,
	FolderOpen,
	Layers,
	type LucideIcon,
	Moon,
	PanelLeft,
	Pin,
	Power,
	Puzzle,
	Sun,
	Table,
	Terminal,
	Trash2,
	X,
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'redux';

import NoItemsFound from '../atoms/NoItemsFound';

interface GenerateContext {
	sidebar: { collapsed: boolean };
}

interface Command {
	id: string;
	category: string;
	name: string;
	keywords: string[];
	icon: LucideIcon;
	action: (dispatch: Dispatch) => void;
}

const CATEGORY_ORDER = [
	'Tabs',
	'Sidebar',
	'View',
	'Preferences',
	'Extensions',
	'Developer',
] as const;

function generateCommands(context: GenerateContext): Command[] {
	return [
		{ id: 'developer:reload_window', category: 'Developer', name: 'Reload window', icon: Power, keywords: [], action: () => window.location.reload() },
		{ id: 'developer:toggle_developer_tools', category: 'Developer', name: 'Toggle developer tools', icon: Bug, keywords: [], action: () => ipcWindowService.toggleDeveloperTools() },

		{ id: 'extensions:reload_all_extensions', category: 'Extensions', name: 'Reload all extensions', icon: Puzzle, keywords: [], action: dispatch => dispatch(reloadExtensions()) },
		{ id: 'extensions:open_extensions_folder', category: 'Extensions', name: 'Open extensions folder', icon: FolderOpen, keywords: [], action: () => ipcExplorerService.revealFile('extensions/') },

		{ id: 'preferences:switch_to_light_theme', category: 'Preferences', name: 'Switch to light theme', icon: Sun, keywords: ['theme', 'mode'], action: () => ipcPreferencesService.switchThemeMode('light') },
		{ id: 'preferences:switch_to_dark_theme', category: 'Preferences', name: 'Switch to dark theme', icon: Moon, keywords: ['theme', 'mode'], action: () => ipcPreferencesService.switchThemeMode('dark') },
		{ id: 'preferences:switch_to_system_theme', category: 'Preferences', name: 'Switch to system theme', icon: Terminal, keywords: ['theme', 'mode'], action: () => ipcPreferencesService.switchThemeMode('system') },

		{ id: 'tabs:visit_next_tab', category: 'Tabs', name: 'Next tab', icon: ArrowRight, keywords: [], action: dispatch => dispatch(tabActions.changeTabNext()) },
		{ id: 'tabs:visit_previous_tab', category: 'Tabs', name: 'Previous tab', icon: ArrowLeft, keywords: [], action: dispatch => dispatch(tabActions.changeTabPrevious()) },
		{ id: 'tabs:make_current_tab_permanent', category: 'Tabs', name: 'Pin current tab', icon: Pin, keywords: ['permanent'], action: dispatch => dispatch(tabActions.makeTabPermanent()) },
		{ id: 'tabs:close_current_tab', category: 'Tabs', name: 'Close current tab', icon: X, keywords: [], action: dispatch => dispatch(tabActions.closeTab()) },
		{ id: 'tabs:close_other_tabs', category: 'Tabs', name: 'Close other tabs', icon: Trash2, keywords: [], action: dispatch => dispatch(tabActions.closeTabsOther()) },
		{ id: 'tabs:close_tabs_to_the_left', category: 'Tabs', name: 'Close tabs to the left', icon: ArrowLeft, keywords: [], action: dispatch => dispatch(tabActions.closeTabsLeft()) },
		{ id: 'tabs:close_tabs_to_the_right', category: 'Tabs', name: 'Close tabs to the right', icon: ArrowRight, keywords: [], action: dispatch => dispatch(tabActions.closeTabsRight()) },
		{ id: 'tabs:close_all_tabs', category: 'Tabs', name: 'Close all tabs', icon: Trash2, keywords: [], action: dispatch => dispatch(tabActions.closeTabsAll()) },

		{ id: 'view:view_getting_started', category: 'View', name: 'Getting started', icon: Layers, keywords: ['welcome', 'intro'], action: dispatch => dispatch(tabActions.changeTab({ type: 'new_project_intro', temporary: false, payload: 'new_project_intro' })) },

		{
			id: 'sidebar:toggle_visibility',
			category: 'Sidebar',
			name: 'Toggle sidebar',
			icon: PanelLeft,
			keywords: ['hide', 'show'],
			action: dispatch => {
				dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: !context.sidebar.collapsed }));
			},
		},
		{
			id: 'sidebar:switch_to_project',
			category: 'Sidebar',
			name: 'Switch to project pane',
			icon: FolderOpen,
			keywords: [],
			action: dispatch => {
				dispatch(sidebarPreferenceSetSelected('project'));
				dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
			},
		},
		{
			id: 'sidebar:switch_to_variables',
			category: 'Sidebar',
			name: 'Switch to variables pane',
			icon: Table,
			keywords: [],
			action: dispatch => {
				dispatch(sidebarPreferenceSetSelected('variables'));
				dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
			},
		},
	];
}

export interface CommandsViewProps {
	content: string;
	reset: () => void;
}

const CommandsView: React.FC<React.PropsWithChildren<CommandsViewProps>> = ({ content, reset }) => {
	const dispatch = useDispatch();
	const sidebarCollapsed = useAppSelector(s => s.global.preferences.sidebar.collapsed.sidebar);
	const context: GenerateContext = useMemo(
		() => ({ sidebar: { collapsed: sidebarCollapsed } }),
		[sidebarCollapsed],
	);

	const [matches, setMatches] = useState<string[]>([]);
	const [active, setActive] = useState<number>(-1);
	const activeRef = useRef<HTMLElement | null>(null);
	const commands = useMemo(() => generateCommands(context), [context]);
	const commandsById = useMemo(() => Object.fromEntries(commands.map(c => [c.id, c])), [commands]);
	const pureContent = content.substring(1);

	const fuse = useMemo(
		() =>
			new Fuse(commands, {
				includeScore: true,
				keys: ['name', 'keywords', 'category'],
				threshold: 0.4,
			}),
		[commands],
	);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			switch (true) {
				case checkShortcut('omni-bar.commands.down', event):
					setActive(movePosition(matches, active, 'forward'));
					setTimeout(() => {
						// @ts-expect-error scrollIntoViewIfNeeded exists in Chromium
						activeRef.current?.scrollIntoViewIfNeeded(false);
					}, 0);
					break;

				case checkShortcut('omni-bar.commands.up', event):
					setActive(movePosition(matches, active, 'backward'));
					setTimeout(() => {
						// @ts-expect-error see above
						activeRef.current?.scrollIntoViewIfNeeded(false);
					}, 0);
					break;

				case checkShortcut('omni-bar.commands.open', event): {
					if (active < 0) break;
					reset();
					const match = matches[active];
					if (!match) return;
					commandsById[match]?.action(dispatch);
					break;
				}

				default:
					return;
			}
			event.preventDefault();
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [matches, active, reset]);

	useEffect(() => {
		if (content === '>') {
			setMatches(commands.map(c => c.id));
			if (active === -1) setActive(0);
			return;
		}
		const matchedIds = fuse.search(pureContent).map(s => s.item.id);
		setMatches(matchedIds);
		if (active === -1 && matchedIds.length > 0) setActive(0);
	}, [content, pureContent]);

	if (matches.length === 0) return <NoItemsFound>{'No matching commands'}</NoItemsFound>;

	// group matches by category, preserving CATEGORY_ORDER, then any extras alphabetically.
	const groups = new Map<string, string[]>();
	for (const id of matches) {
		const cat = commandsById[id]?.category ?? 'Other';
		const list = groups.get(cat) ?? [];
		list.push(id);
		groups.set(cat, list);
	}
	const orderedCats = [...CATEGORY_ORDER.filter(c => groups.has(c)), ...[...groups.keys()].filter(c => !CATEGORY_ORDER.includes(c as typeof CATEGORY_ORDER[number])).sort()];

	let runningIdx = 0;

	return (
		<Box py='1'>
			{orderedCats.map((cat, ci) => {
				const ids = groups.get(cat)!;
				return (
					<Box key={cat} mb={ci === orderedCats.length - 1 ? '0' : '1'}>
						<Box px='3' pt='1.5' pb='0.5' fontSize='9px' fontWeight='700' color='fg.subtle' letterSpacing='0.06em' textTransform='uppercase'>
							{cat}
						</Box>
						{ids.map(id => {
							const command = commandsById[id];
							if (!command) return null;
							const idx = runningIdx++;
							const isActive = active === idx;
							const Icon = command.icon;

							return (
								<Box
									key={id}
									ref={(i: HTMLElement | null) => {
										if (isActive) activeRef.current = i;
									}}
									tabIndex={0}
									mx='1.5'
									my='0.5'
									px='2.5'
									py='2'
									borderRadius='md'
									cursor='pointer'
									color={isActive ? 'white' : 'fg.muted'}
									bg={isActive ? 'accent.teal' : 'transparent'}
									boxShadow={
										isActive
											? '0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-teal) 70%, transparent), 0 6px 14px color-mix(in srgb, var(--beak-colors-accent-teal) 35%, transparent)'
											: undefined
									}
									transition='background-color .14s ease, color .14s ease, box-shadow .14s ease'
									_hover={{
										color: 'fg.default',
										bg: isActive
											? 'accent.teal'
											: 'color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)',
									}}
									onClick={() => {
										reset();
										command.action(dispatch);
									}}
								>
									<Flex align='center' gap='2'>
										<Box color={isActive ? 'white' : 'fg.subtle'} flex='0 0 auto'>
											<Icon size={13} />
										</Box>
										<Box fontSize='sm' fontWeight={isActive ? '600' : '500'} color={isActive ? 'white' : undefined}>
											{command.name}
										</Box>
									</Flex>
								</Box>
							);
						})}
					</Box>
				);
			})}
		</Box>
	);
};

export default CommandsView;
