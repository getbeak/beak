import { Box, Flex } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

import EnterMagicState, { type MagicState } from './organisms/EnterMagicState';

interface MagicalProps {
	email: string;
	revertFromMagical: () => void;
}

const Magical: React.FC<MagicalProps> = ({ email, revertFromMagical }) => {
	const [inboundState, setInboundState] = useState<MagicState | undefined>(void 0);

	useEffect(() => {
		function listener(_event: unknown, payload: MagicState) {
			const { code, state } = payload;
			setInboundState({ code, state });
		}

		window.secureBridge.ipc.on('inbound_magic_link', listener);

		return () => {
			window.secureBridge.ipc.off('inbound_magic_link', listener);
		};
	}, []);

	return (
		<Box m='10'>
			<Flex align='center' gap='2.5' mb='3'>
				<Flex
					align='center'
					justify='center'
					w='34px'
					h='34px'
					borderRadius='full'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
					color='accent.pink'
					boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 16%, transparent)'
				>
					<Sparkles size={15} strokeWidth={2} />
				</Flex>
				<Box fontSize='xl' fontWeight='700' color='fg.default' letterSpacing='-0.02em' lineHeight='1.1'>{'Almost there'}</Box>
			</Flex>
			<EnterMagicState email={email} inboundState={inboundState} reset={revertFromMagical} />
		</Box>
	);
};

export default Magical;
