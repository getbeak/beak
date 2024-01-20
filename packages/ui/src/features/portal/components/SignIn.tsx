import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import EnterMagicState, { MagicState } from './organisms/EnterMagicState';
import RequestMagicLink from './organisms/RequestMagicLink';

type Mode = 'request_magic_link' | 'use_magic_link';

const SignIn: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [email, setEmail] = useState('');
	const [mode, setMode] = useState<Mode>('request_magic_link');
	const [inboundState, setInboundState] = useState<MagicState | undefined>(void 0);

	useEffect(() => {
		function listener(_event: unknown, payload: MagicState) {
			const { code, state } = payload;

			setMode('use_magic_link');
			setInboundState({ code, state });
		}

		window.secureBridge.ipc.on('inbound_magic_link', listener);

		return () => {
			window.secureBridge.ipc.off('inbound_magic_link', listener);
		};
	}, []);

	return (
		<Wrapper>
			<Logo />
			<Title>{'Welcome to Beak!'}</Title>

			{mode === 'request_magic_link' && (
				<RequestMagicLink
					email={email}
					onEmailChange={setEmail}
					onMagicLinkSent={() => setMode('use_magic_link')}
				/>
			)}
			{mode === 'use_magic_link' && (
				<EnterMagicState
					email={email}
					inboundState={inboundState}
					reset={() => setMode('request_magic_link')}
				/>
			)}
		</Wrapper>
	);
};

const Wrapper = styled.div`
	width: 100%;
`;

const Logo = styled.div`
	width: 70px; height: 70px;
	margin: 0 auto;
	margin-bottom: 5px;

	background-image: url('images/logo-tile.png');
	background-position: center;
	background-size: contain;
`;

const Title = styled.div`
	text-align: center;
	font-size: 24px;
	font-weight: 500;
	margin-bottom: 10px;
`;

export default SignIn;
