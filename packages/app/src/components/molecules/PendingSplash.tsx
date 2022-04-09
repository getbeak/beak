import React from 'react';
import Kbd from '@beak/app/components/atoms/Kbd';
import { instance as windowSessionInstance } from '@beak/app/contexts/window-session-context';
import shortcutDefinitions, { Shortcuts } from '@beak/app/lib/keyboard-shortcuts';
import { PlatformAgnosticDefinitions, PlatformSpecificDefinitions } from '@beak/app/lib/keyboard-shortcuts/types';
import { TypedObject } from '@beak/common/helpers/typescript';
import styled from 'styled-components';

const displayShortcuts: Partial<Record<Shortcuts, string>> = {
	'menu-bar.file.new-request': 'Create new request',
	'global.execute-request': 'Execute request',
	'omni-bar.launch.finder': 'Open omni bar',
	'sidebar.toggle-view': 'Toggle sidebar',
};

const PendingSlash: React.FunctionComponent = () => (
	<Wrapper>
		<FadedLogo />
		<ShortcutContainer>
			{TypedObject.keys(displayShortcuts).map(k => {
				const name = displayShortcuts[k];
				const definition = shortcutDefinition(shortcutDefinitions[k]);

				return (
					<SingleShortcut key={k}>
						<ShortcutName>{name}</ShortcutName>
						<div>
							{definition.ctrlOrMeta && <Kbd>{'⌘'}</Kbd>}
							{definition.ctrl && <Kbd>{'⌃'}</Kbd>}
							{definition.alt && <Kbd>{'⌥'}</Kbd>}
							{definition.meta && <Kbd>{'⌘'}</Kbd>}
							{definition.shift && <Kbd>{'⇧'}</Kbd>}
							{' '}
							<NonCommandKeys>
								{Array.isArray(definition.key) && definition.key.map(k => (
									<React.Fragment>
										<Kbd key={k}>{renderKey(k)}</Kbd>
										<KbdOption>{'|'}</KbdOption>
									</React.Fragment>
								))}
								{typeof definition.key === 'string' && <Kbd>{renderKey(definition.key)}</Kbd>}
							</NonCommandKeys>
						</div>
					</SingleShortcut>
				);
			})}
		</ShortcutContainer>
	</Wrapper>
);

function renderKey(key: string) {
	if (key.length === 1)
		return key.toUpperCase();

	switch (key) {
		case 'ArrowUp': return '↑';
		case 'ArrowDown': return '↓';

		default: return key;
	}
}

function shortcutDefinition(definition: PlatformSpecificDefinitions | PlatformAgnosticDefinitions) {
	if (definition.type === 'agnostic')
		return definition;

	return definition[windowSessionInstance.getPlatform()];
}

const Wrapper = styled.div`
	display: flex;
	width: 100%;
	height: 100%;

	align-items: center;
	justify-content: center;
	flex-direction: column;
`;

const FadedLogo = styled.div`
	width: 200px;
	height: 200px;
	background: url('./images/logo-blank.svg');
	background-repeat: no-repeat;
	background-position: center;
	background-size: contain;
`;

const ShortcutContainer = styled.div``;

const SingleShortcut = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
	margin-bottom: 10px;

	font-size: 12px;
	line-height: 11px;
	color: ${p => p.theme.ui.textMinor};
`;

const ShortcutName = styled.div`
	display: flex;
	align-items: center;
	justify-content: right;
`;

const NonCommandKeys = styled.div`
	display: inline-block;
`;

const KbdOption = styled.div`
	display: inline-block;
	content: '|';
	margin: 0 2px;

	&:last-child {
		display: none;
	}
`;

export default PendingSlash;
