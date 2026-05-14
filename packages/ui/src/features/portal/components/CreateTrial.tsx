import { Box, Flex, Image } from '@chakra-ui/react';
import type Squawk from '@beak/common/utils/squawk';
import ArrowButton from '@beak/ui/components/atoms/ArrowButton';
import { motion } from 'framer-motion';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import type { MagicState } from './organisms/EnterMagicState';
import EnterTrialMagicState from './organisms/EnterTrialMagicState';
import RequestTrial from './organisms/RequestTrial';

type Variant = 'default' | 'magic_link';

interface CreateTrialProps {
	onChangeToDefault: () => void;
}

const CreateTrial: React.FC<CreateTrialProps> = ({ onChangeToDefault }) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [email, setEmail] = useState('');
	const [variant, setVariant] = useState<Variant>('default');
	const [inboundState, setInboundState] = useState<MagicState | undefined>(void 0);

	useEffect(() => {
		inputRef.current?.select();
	}, []);

	useEffect(() => {
		function listener(_event: unknown, payload: MagicState) {
			const { code, state } = payload;
			setVariant('magic_link');
			setInboundState({ code, state });
		}

		window.secureBridge.ipc.on('inbound_magic_link', listener);

		return () => {
			window.secureBridge.ipc.off('inbound_magic_link', listener);
		};
	}, []);

	return (
		<Box position='relative' w='100%' mx='auto' maxW='460px'>
			<Box mb='1'>
				<ArrowButton onClick={() => onChangeToDefault()}>{'Back'}</ArrowButton>
			</Box>
			<Flex direction='column' gap='1' mb='3'>
				<motion.div
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3, ease: 'easeOut' }}
				>
					<Image
						src='images/logo-tile.png'
						w='48px'
						h='48px'
						mb='2'
						filter='drop-shadow(0px 8px 24px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent))'
					/>
				</motion.div>
				<Box fontSize='2xl' fontWeight='700' color='fg.default' letterSpacing='-0.02em' lineHeight='1.1'>
					{'Start your free Beak trial'}
				</Box>
				<Box fontSize='sm' color='fg.muted' mt='1' lineHeight='1.5' maxW='420px'>
					{'No credit card, no fuss, no limits — 14 days of the full Beak experience.'}
				</Box>
			</Flex>
			<Box style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
				{variant === 'default' && (
					<RequestTrial
						email={email}
						onChangeToDefault={onChangeToDefault}
						onEmailChange={email => setEmail(email)}
						onMagicLinkSent={() => setVariant('magic_link')}
					/>
				)}
				{variant === 'magic_link' && (
					<EnterTrialMagicState email={email} reset={() => setVariant('default')} inboundState={inboundState} />
				)}
			</Box>
		</Box>
	);
};

export function getErrorMessage(error: Squawk) {
	switch (error.code) {
		case 'invalid_email':
			return 'Please enter a valid email address';

		case 'already_subscribed':
			return 'You already have a subscription';

		case 'trial_already_used':
			return "You've already used the trial";

		default:
			return `There was a problem sending the magic link (${error.code})`;
	}
}

export default CreateTrial;
