import React, { useState } from 'react';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import styled from 'styled-components';

const hints: string[] = [
	`You can collapse the sidebar by clicking the same icon again, or pressing ${renderPlainTextDefinition('sidebar.toggle-view')}`,
	'You can use variables to make request bodies more dynamic',
	`Use the omni bar to get around Beak quickly... ${renderPlainTextDefinition('omni-bar.launch.commands')} or ${renderPlainTextDefinition('omni-bar.launch.finder')}`,
	'Keep an eye out for easter eggs...',
	`Quickly run a request from anywhere by pressing ${renderPlainTextDefinition('global.execute-request')}`,
	'Check out the preferences to make Beak more you',
	'Consectetur velit consequat minim dolor ex mollit amet',
	'Eiusmod culpa anim id consequat nisi nisi do sint deserunt irure officia',
	'Aliqua deserunt sunt excepteur non duis ad',
];

const ProjectLoading: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [hintIndex] = useState<number>(() => Math.floor(Math.random() * hints.length));

	return (
		<Wrapper>
			<div>
				<Logo
					width={60}
					src={'/images/logo-tile.png'}
				/>

				<Header>{'Did you know?'}</Header>
				<Body>{hints[hintIndex]}</Body>
			</div>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: absolute;
	top: 0; bottom: 0; left: 0; right: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;

	background: ${p => p.theme.ui.background};
`;

const Logo = styled.img`
	filter: drop-shadow(0px 8px 24px ${p => p.theme.ui.textOnSurfaceBackground}44);
	margin-bottom: 20px;
`;

const Header = styled.div`
	text-transform: uppercase;
	font-size: 13px;
	font-weight: 700;
`;

const Body = styled.div`
	margin: 0 40px;
	margin-top: 4px;
	max-width: 250px;

	font-size: 13px;
	line-height: 18px;
`;

export default ProjectLoading;
