import React from 'react';
import Dialog from '@beak/app/components/molecules/Dialog';
import styled from 'styled-components';

import useArbiterLocking from '../../hooks/use-arbiter-locking';

export interface ArbiterDialogProps {
	open: boolean;
	onClose: () => void;
}

export const ArbiterDialog: React.FC<ArbiterDialogProps> = props => {
	const { friendlyLockNotice, lastSuccessfulCheck } = useArbiterLocking();

	if (!props.open)
		return null;

	return (
		<Dialog onClose={props.onClose}>
			<Container>
				<Title>{'Unable to check subscription status'}</Title>

				<Body>
					{'Beak is currently unable to check the validity of your subscription. '}
					{'Due to this, Beak will sign you out '}
					<strong>{friendlyLockNotice}</strong>
					{'. If you do '}
					{'have an active subscription, check your internet connection before '}
					{'the lock out time to prevent any disruption to your workflow.'}
				</Body>

				<Body>
					{'The last successful check was on '}
					<strong>{lastSuccessfulCheck.toString()}</strong>{'.'}
				</Body>
			</Container>
		</Dialog>
	);
};

const Container = styled.div`
	width: 500px;

	padding: 15px;
	font-size: 14px;
`;

const Title = styled.div`
	font-size: 24px;
	font-weight: 300;
`;
const Body = styled.p`
	font-size: 13px;
	margin: 5px 0;
	color: ${p => p.theme.ui.textMinor};
`;

export default ArbiterDialog;
