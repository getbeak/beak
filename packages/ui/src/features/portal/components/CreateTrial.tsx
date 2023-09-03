import React, { useEffect, useRef, useState } from 'react';
import Squawk from '@beak/common/utils/squawk';
import ArrowButton from '@beak/ui/components/atoms/ArrowButton';
import Button from '@beak/ui/components/atoms/Button';
import styled from 'styled-components';

import { MagicState } from './organisms/EnterMagicState';
import EnterTrialMagicState from './organisms/EnterTrialMagicState';
import RequestTrial from './organisms/RequestTrial';

type Variant = 'default' | 'magic_link';

interface CreateTrialProps {
	onChangeToDefault: () => void;
}

const CreateTrial: React.FC<React.PropsWithChildren<CreateTrialProps>> = ({ onChangeToDefault }) => {
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
		<Wrapper>
			<ArrowButton onClick={() => onChangeToDefault()}>
				{'Go back'}
			</ArrowButton>
			<Logo src={'./images/logo-tile.png'} />
			<Title>{'Start your free Beak trial'}</Title>
			<SubTitle>
				{'No credit card, no fuss, no limits... Just 14 days of the full Beak experience.'}
			</SubTitle>
			<ActionContainer>
				{variant === 'default' && (
					<RequestTrial
						email={email}
						onChangeToDefault={onChangeToDefault}
						onEmailChange={email => setEmail(email)}
						onMagicLinkSent={() => setVariant('magic_link')}
					/>
				)}
				{variant === 'magic_link' && (
					<EnterTrialMagicState
						email={email}
						reset={() => setVariant('default')}
						inboundState={inboundState}
					/>
				)}
			</ActionContainer>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: relative;
	width: 100%;
	margin-left: -20px;
`;

const Logo = styled.img`
	width: 50px; height: 50px;
	text-align: center;
	margin: 5px auto;
`;

const Title = styled.div`
	font-size: 28px;
	font-weight: 500;
	margin-bottom: 0px;
`;

const SubTitle = styled.p`
	font-size: 14px;
	margin-top: 5px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

const ActionContainer = styled.div`
	position: absolute;
	bottom: 0;
	max-width: 450px;
	-webkit-app-region: no-drag;

	> ${Button} {
		margin-top: 5px;
		width: 100%;
	}
`;

export function getErrorMessage(error: Squawk) {
	switch (error.code) {
		case 'invalid_email':
			return 'Please enter a valid email address';

		case 'already_subscribed':
			return 'You already have a subscription';

		case 'trial_already_used':
			return 'You\'ve already used the trial';

		default:
			return `There was a problem sending the magic link (${error.code})`;
	}
}

export default CreateTrial;
