import { Box, Flex, Image } from '@chakra-ui/react';
import { motion } from 'framer-motion';
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
			<Flex direction='column' align='center' gap='1' mb='3'>
				<motion.div
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3, ease: 'easeOut' }}
				>
					<Image
						src='images/logo-tile.png'
						w='64px'
						h='64px'
						filter='drop-shadow(0px 8px 24px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent))'
					/>
				</motion.div>
				<Box
					textTransform='uppercase'
					fontSize='10px'
					fontWeight='700'
					letterSpacing='0.08em'
					color='accent.pink'
					mt='1'
				>
					{'Beak'}
				</Box>
				<Box fontSize='xl' fontWeight='700' color='fg.default' letterSpacing='-0.02em'>
					{'Welcome back'}
				</Box>
			</Flex>

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
