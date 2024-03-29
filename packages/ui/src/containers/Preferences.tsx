import React, { useContext, useState } from 'react';
import { toHexAlpha } from '@beak/design-system/utils';
import { faMoneyCheck, faPenToSquare, faUserShield, faWindowRestore } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { css, useTheme } from 'styled-components';

import WindowSessionContext from '../contexts/window-session-context';
import AccountItem from '../features/preferences/components/molecules/AccountItem';
import EditorPane from '../features/preferences/components/organisms/EditorPane';
import EngineeringPane from '../features/preferences/components/organisms/EngineeringPane';
import GeneralPane from '../features/preferences/components/organisms/GeneralPane';
import SubscriptionPane from '../features/preferences/components/organisms/SubscriptionPane';

const About: React.FC<React.PropsWithChildren<unknown>> = () => {
	const windowSession = useContext(WindowSessionContext);
	const [tab, setTab] = useState('general');
	const theme = useTheme();
	const { blankFill, primaryFill } = theme.ui;

	return (
		<Wrapper>
			<Sidebar $darwin={windowSession.isDarwin()}>
				<SidebarSpacer />
				<AccountItem />
				<SidebarSpacer />
				<SidebarItem $active={tab === 'general'} onClick={() => setTab('general')}>
					<FontAwesomeIcon
						icon={faWindowRestore}
						color={tab === 'general' ? blankFill : primaryFill}
					/>
					<span>{'General'}</span>
				</SidebarItem>
				<SidebarItem $active={tab === 'editor'} onClick={() => setTab('editor')}>
					<FontAwesomeIcon
						icon={faPenToSquare}
						color={tab === 'editor' ? blankFill : primaryFill}
					/>
					<span>{'Rich text editor'}</span>
				</SidebarItem>
				<SidebarItem $active={tab === 'subscription'} onClick={() => setTab('subscription')}>
					<FontAwesomeIcon
						icon={faMoneyCheck}
						color={tab === 'subscription' ? blankFill : primaryFill}
					/>
					<span>{'Subscription'}</span>
				</SidebarItem>
				<SidebarItem $active={tab === 'engineering'} onClick={() => setTab('engineering')}>
					<FontAwesomeIcon
						icon={faUserShield}
						color={tab === 'engineering' ? blankFill : primaryFill}
					/>
					<span>{'Shhh...'}</span>
				</SidebarItem>
			</Sidebar>
			<Border />
			<Panel>
				{tab === 'general' && <GeneralPane />}
				{tab === 'editor' && <EditorPane />}
				{tab === 'subscription' && <SubscriptionPane />}
				{tab === 'engineering' && <EngineeringPane />}
			</Panel>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	display: grid;
	grid-template-rows: 1fr;
	grid-template-columns: .25fr 1px .75fr;
	height: 100vh;
`;

const Sidebar = styled.div<{ $darwin: boolean }>`
	padding: 20px 10px;
	height: 100%;
	overflow-y: overlay;
	-webkit-app-region: drag;

	${p => p.$darwin && css`
		padding-top: 40px;
		height: calc(100% - 60px);
	`}

	> * {
		-webkit-app-region: no-drag;
	}
`;

const SidebarSpacer = styled.div`
	height: 10px;
`;

const SidebarItem = styled.div<{ $active?: boolean }>`
	display: flex;

	width: calc(100% - 20px);
	padding: 10px;
	border-radius: 10px;
	margin-bottom: 6px;

	color: ${p => p.theme.ui.textOnSurfaceBackground};
	${p => p.$active && css`
		background: ${toHexAlpha(p.theme.ui.primaryFill, 0.75)};
		color: ${p => p.theme.ui.textOnAction};
	`}

	&:last-of-type {
		margin-bottom: 0;
	}

	&:hover {
		cursor: pointer;
		background: ${p => !p.$active && toHexAlpha(p.theme.ui.primaryFill, 0.5)}
	}

	> svg {
		width: 1.25em !important;
		margin-right: 10px;
	}
	> span {
		margin-top: -2px;
	}
`;

const Border = styled.div`
	background: ${p => p.theme.ui.backgroundBorderSeparator};
`;

const Panel = styled.div`
	background: ${p => p.theme.ui.background};
`;

export default About;
