import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import tabActions from '@beak/app/features/tabs/store/actions';
import { ipcExplorerService, ipcPreferencesService, ipcWindowService } from '@beak/app/lib/ipc';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { reloadExtensions } from '@beak/app/store/extensions/actions';
import { movePosition } from '@beak/app/utils/arrays';
import Fuse from 'fuse.js';
import type { Dispatch } from 'redux';
import styled, { css } from 'styled-components';

import NoItemsFound from '../atoms/NoItemsFound';

function generateCommands(): Command[] {
	return [{ // Developer
		id: 'developer:reload_window',
		name: 'Developer: Reload window',
		keywords: [],
		action: () => window.location.reload(),
	}, {
		id: 'developer:toggle_developer_tools',
		name: 'Developer: Toggle developer tools',
		keywords: [],
		action: () => ipcWindowService.toggleDeveloperTools(),
	}, { // Extensions
		id: 'extensions:reload_all_extensions',
		name: 'Extensions: Reload all extensions',
		keywords: [],
		action: dispatch => dispatch(reloadExtensions()),
	}, {
		id: 'extensions:open_extensions_folder',
		name: 'Extensions: Open extensions folder',
		keywords: [],
		action: () => ipcExplorerService.revealFile('extensions/'),
	}, { // Preferences
		id: 'preferences:switch_to_light_theme',
		name: 'Preferences: Switch to light theme',
		keywords: [],
		action: () => ipcPreferencesService.switchThemeMode('light'),
	}, {
		id: 'preferences:switch_to_dark_theme',
		name: 'Preferences: Switch to dark theme',
		keywords: [],
		action: () => ipcPreferencesService.switchThemeMode('dark'),
	}, {
		id: 'preferences:switch_to_system_theme',
		name: 'Preferences: Switch to system theme',
		keywords: [],
		action: () => ipcPreferencesService.switchThemeMode('system'),
	}, { // Tabs
		id: 'tabs:visit_next_tab',
		name: 'Tabs: Visit next tab',
		keywords: [],
		action: dispatch => dispatch(tabActions.changeTabNext()),
	}, {
		id: 'tabs:visit_previous_tab',
		name: 'Tabs: Visit previous tab',
		keywords: [],
		action: dispatch => dispatch(tabActions.changeTabPrevious()),
	}, {
		id: 'tabs:make_current_tab_permanent',
		name: 'Tabs: Make current tab permanent',
		keywords: [],
		action: dispatch => dispatch(tabActions.makeTabPermanent()),
	}, {
		id: 'tabs:close_current_tab',
		name: 'Tabs: Close current tab',
		keywords: [],
		action: dispatch => dispatch(tabActions.closeTab()),
	}, {
		id: 'tabs:close_other_tabs',
		name: 'Tabs: Close other tabs',
		keywords: [],
		action: dispatch => dispatch(tabActions.closeTabsOther()),
	}, {
		id: 'tabs:close_tabs_to_the_left',
		name: 'Tabs: Close tabs to the left',
		keywords: [],
		action: dispatch => dispatch(tabActions.closeTabsLeft()),
	}, {
		id: 'tabs:close_tabs_to_the_right',
		name: 'Tabs: Close tabs to the right',
		keywords: [],
		action: dispatch => dispatch(tabActions.closeTabsRight()),
	}, {
		id: 'tabs:close_all_tabs',
		name: 'Tabs: Close all tabs',
		keywords: [],
		action: dispatch => dispatch(tabActions.closeTabsAll()),
	}];
}

interface Command {
	id: string;
	name: string;
	keywords: string[];
	action: (dispatch: Dispatch) => void;
}

export interface CommandsViewProps {
	content: string;
	reset: () => void;
}

const CommandsView: React.FC<React.PropsWithChildren<CommandsViewProps>> = ({ content, reset }) => {
	const dispatch = useDispatch();
	const [matches, setMatches] = useState<string[]>([]);
	const [active, setActive] = useState<number>(-1);
	const activeRef = useRef<HTMLElement | null>(null);
	const commands = generateCommands();
	const pureContent = content.substring(1);

	const fuse = new Fuse(commands, {
		includeScore: true,
		keys: [
			'name',
			'keywords',
		],
		threshold: 0.4,
	});

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			switch (true) {
				case checkShortcut('omni-bar.commands.down', event):
					setActive(movePosition(matches, active, 'forward'));
					setTimeout(() => {
						// This actually exists
						// @ts-expect-error
						activeRef.current?.scrollIntoViewIfNeeded(false);
					}, 0);

					break;

				case checkShortcut('omni-bar.commands.up', event):
					setActive(movePosition(matches, active, 'backward'));
					setTimeout(() => {
						// This actually exists
						// @ts-expect-error
						activeRef.current?.scrollIntoViewIfNeeded(false);
					}, 0);

					break;

				case checkShortcut('omni-bar.commands.open', event): {
					if (active < 0)
						break;

					reset();

					const match = matches[active];

					if (!match)
						return;

					commands.find(c => c.id === match)?.action(dispatch);

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

			if (active === -1)
				setActive(0);

			return;
		}

		const matchedIds = fuse.search(pureContent).map(s => s.item.id);

		setMatches(matchedIds);

		if (active === -1 && matchedIds.length > 0)
			setActive(0);
	}, [content, pureContent]);

	return (
		<Container tabIndex={0}>
			{matches.length === 0 && (
				<NoItemsFound>
					{'No matching commands found'}
				</NoItemsFound>
			)}
			{matches.map((k, idx) => {
				const command = commands.find(c => c.id === k);

				if (!command)
					return null;

				return (
					<Item
						$active={active === idx}
						key={k}
						ref={i => {
							if (active === idx)
								activeRef.current = i;
						}}
						tabIndex={0}
						onClick={() => {
							reset();
							command.action(dispatch);
						}}
					>
						{command.name}
					</Item>
				);
			})}
		</Container>
	);
};

const Container = styled.div`
	padding: 8px 0;
`;

const Item = styled.div<{ $active: boolean }>`
	font-size: 13px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	padding: 4px 10px;
	cursor: pointer;

	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: none;

	&:hover { background: ${p => p.theme.ui.secondaryActionMuted}; }
	${p => p.$active ? css`background: ${p => p.theme.ui.secondaryActionMuted};` : ''}
`;

export default CommandsView;
