import { Box, Image } from '@chakra-ui/react';
import type Squawk from '@beak/common/utils/squawk';
import ArrowButton from '@beak/ui/components/atoms/ArrowButton';
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
		<Box position='relative' w='100%' ml='-5'>
			<ArrowButton onClick={() => onChangeToDefault()}>{'Go back'}</ArrowButton>
			<Image src='images/logo-tile.png' w='50px' h='50px' mx='auto' my='1.5' />
			<Box fontSize='3xl' fontWeight='medium' mb='0'>{'Start your free Beak trial'}</Box>
			<Box as='p' fontSize='lg' mt='1.5' color='fg.default'>
				{'No credit card, no fuss, no limits... Just 14 days of the full Beak experience.'}
			</Box>
			<Box
				position='absolute'
				bottom='0'
				maxW='450px'
				style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
				css={{ '> button': { marginTop: '5px', width: '100%' } }}
			>
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
