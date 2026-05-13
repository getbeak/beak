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
	}, []);

	return (
		<Box m='10'>
			<Flex align='center' gap='2' mb='2' color='accent.pink'>
				<Sparkles size={18} />
				<Box fontSize='xl' fontWeight='600' color='fg.default'>{'Almost there'}</Box>
			</Flex>
			<EnterMagicState email={email} inboundState={inboundState} reset={revertFromMagical} />
		</Box>
	);
};

export default Magical;
