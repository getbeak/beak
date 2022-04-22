import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import EnterMagicState, { MagicState } from './organisms/EnterMagicState';

interface MagicalProps {
	email: string;
	revertFromMagical: () => void;
}

const Magical: React.FunctionComponent<React.PropsWithChildren<MagicalProps>> = ({ email, revertFromMagical }) => {
	const [inboundState, setInboundState] = useState<MagicState | undefined>(void 0);

	useEffect(() => {
		function listener(_event: unknown, payload: MagicState) {
			const { code, state } = payload;

			setInboundState({ code, state });
		}

		window.secureBridge.ipc.on('inbound_magic_link', listener);
	}, []);

	return (
		<Wrapper>
			<Title>{'Almost there'}</Title>

			<EnterMagicState
				email={email}
				inboundState={inboundState}
				reset={revertFromMagical}
			/>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	margin: 50px;
`;

const Title = styled.div`
	font-size: 24px;
	font-weight: 500;
`;

export default Magical;
