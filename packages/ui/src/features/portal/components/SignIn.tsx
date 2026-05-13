import { Box } from '@chakra-ui/react';
import * as React from 'react';
import { useEffect, useState } from 'react';

import EnterMagicState, { type MagicState } from './organisms/EnterMagicState';
import RequestMagicLink from './organisms/RequestMagicLink';

type Mode = 'request_magic_link' | 'use_magic_link';

const SignIn: React.FC = () => {
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
		<Box w='100%'>
			<Box
				w='70px'
				h='70px'
				mx='auto'
				mb='1.5'
				bgImage="url('images/logo-tile.png')"
				bgPos='center'
				bgSize='contain'
			/>
			<Box textAlign='center' fontSize='2xl' fontWeight='medium' mb='2.5'>
				{'Welcome to Beak!'}
			</Box>

			{mode === 'request_magic_link' && (
				<RequestMagicLink email={email} onEmailChange={setEmail} onMagicLinkSent={() => setMode('use_magic_link')} />
			)}
			{mode === 'use_magic_link' && (
				<EnterMagicState email={email} inboundState={inboundState} reset={() => setMode('request_magic_link')} />
			)}
		</Box>
	);
};

export default SignIn;
