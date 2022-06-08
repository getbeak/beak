import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ipcWindowService } from '@beak/app/lib/ipc';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { movePosition } from '@beak/app/utils/arrays';
import ksuid from '@cuvva/ksuid';
import Fuse from 'fuse.js';
import type { Dispatch } from 'redux';
import styled, { css } from 'styled-components';

const commands: Command[] = [{
	id: ksuid.generate('omnicmd').toString(),
	name: 'Developer: Reload window',
	keywords: [],
	action: () => window.location.reload(),
}, {
	id: ksuid.generate('omnicmd').toString(),
	name: 'Developer: Toggle developer tools',
	keywords: [],
	action: () => ipcWindowService.toggleDeveloperTools(),
}, {
	id: ksuid.generate('omnicmd').toString(),
	name: 'Extensions: Reload all extensions',
	keywords: [],
	action: () => ipcWindowService.toggleDeveloperTools(),
}, {
	id: ksuid.generate('omnicmd').toString(),
	name: 'Extensions: Open extensions folder',
	keywords: [],
	action: () => ipcWindowService.toggleDeveloperTools(),
}];

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

	const fuse = new Fuse(commands, {
		includeScore: true,
		keys: [
			'name',
			'keywords',
		],
	});

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			switch (true) {
				case checkShortcut('omni-bar.commands.down', event):
					setActive(movePosition(matches, active, 'forward'));

					break;

				case checkShortcut('omni-bar.commands.up', event):
					setActive(movePosition(matches, active, 'backward'));

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
		const matchedIds = fuse.search(content).map(s => s.item.id);

		setMatches(matchedIds);
	}, [content]);

	if (!content)
		return null;

	return (
		<Container tabIndex={0}>
			{matches?.map((k, i) => {
				const command = commands.find(c => c.id === k);

				if (!command)
					return null;

				return (
					<Item
						active={active === i}
						key={k}
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
	border-top: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	padding: 8px 0;
`;

const Item = styled.div<{ active: boolean }>`
	font-size: 13px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	padding: 4px 10px;
	cursor: pointer;

	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: none;

	&:hover { background: ${p => p.theme.ui.secondaryActionMuted}; }
	${p => p.active ? css`background: ${p => p.theme.ui.secondaryActionMuted};` : ''}
`;

export default CommandsView;
