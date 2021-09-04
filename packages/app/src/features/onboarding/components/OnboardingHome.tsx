import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import EnterMagicState, { MagicState } from './organisms/EnterMagicState';
import RequestMagicLink from './organisms/RequestMagicLink';

type State = 'request_magic_link' | 'enter_magic_state';

const OnboardingHome: React.FunctionComponent = () => {
	const [email, setEmail] = useState('');
	const [state, setState] = useState<State>('request_magic_link');
	const [inboundState, setInboundState] = useState<MagicState | undefined>(void 0);
	const windowSession = useContext(WindowSessionContext);

	useEffect(() => {
		function listener(_event: unknown, payload: MagicState) {
			const { code, state } = payload;

			setState('enter_magic_state');
			setInboundState({ code, state });
		}

		window.secureBridge.ipc.on('inbound_magic_link', listener);

		return () => {
			window.secureBridge.ipc.off('inbound_magic_link', listener);
		};
	}, []);

	return (
		<Wrapper>
			<DragBar />

			<Container>
				<Title $darwin={windowSession.isDarwin()}>{'Welcome to the Beak Beta!'}</Title>
				<SubTitle>
					{'To sign in please enter the email address enrolled in the Beta Beta. '}
					{'We\'ll send you a magic link you can use to sign in. If you aren\'t in the Beta yet, you can '}
					{'request access over at '}
					<FakeAnchor onClick={() => ipcExplorerService.launchUrl('https://getbeak.app')} >
						{'https://getbeak.app'}
					</FakeAnchor>
				</SubTitle>

				{state === 'request_magic_link' && (
					<RequestMagicLink
						email={email}
						complete={() => setState('enter_magic_state')}
						updateEmail={setEmail}
					/>
				)}
				{state === 'enter_magic_state' && (
					<EnterMagicState
						email={email}
						inboundState={inboundState}
						reset={() => setState('request_magic_link')}
					/>
				)}
			</Container>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	background: ${props => props.theme.ui.background};
	height: 100vh;
`;

const DragBar = styled.div`
	-webkit-app-region: drag;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 60px;
`;

const Container = styled.div`
	position: relative;
	padding: 15px;
	height: calc(100vh - 30px);

	z-index: 2;
`;

const Title = styled.h1<{ $darwin?: boolean }>`
	margin: 0;
	margin-bottom: 5px;
	${p => p.$darwin && 'margin-top: 15px;'}
	font-size: 28px;
	font-weight: 300;
`;

const SubTitle = styled.h2`
	font-size: 14px;
	margin: 0;
	margin-bottom: 10px;
	font-weight: 400;
	color: ${props => props.theme.ui.textMinor};
`;

const FakeAnchor = styled.span`
	cursor: pointer;
	color: #e08130;
`;

export default OnboardingHome;
