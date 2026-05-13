import { Box } from '@chakra-ui/react';
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
		<Box m='12'>
			<Box fontSize='2xl' fontWeight='medium'>{'Almost there'}</Box>
			<EnterMagicState email={email} inboundState={inboundState} reset={revertFromMagical} />
		</Box>
	);
};

export default Magical;
