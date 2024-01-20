import React from 'react';
import { FlightInProgress as FlightInProgressType } from '@beak/ui/store/flight/types';
import styled, { keyframes } from 'styled-components';

const pulseRing = keyframes`
	0% { transform: scale(.33); }
	80%, 100% { opacity: 0; }
`;

interface FlightInProgressProps {
	requestId: string;
	currentFlight: FlightInProgressType | undefined;
}

const FlightInProgress: React.FC<FlightInProgressProps> = ({ currentFlight, requestId }) => {
	const shown = Boolean(currentFlight && currentFlight.requestId === requestId && currentFlight.flighting);

	return (
		// <Container $shown={Boolean(currentFlight)}>
		<Container $shown={shown}>
			<PulseOrb />
		</Container>
	);
};

const Container = styled.div<{ $shown: boolean }>`
	position: absolute;
	pointer-events: none;
	display: flex;
	top: 0; bottom: 0; left: 0; right: 0;
	align-items: center; justify-content: center;
	background: ${p => p.theme.ui.background};
	text-align: center;
	transition: opacity .2s ease-out;
	opacity: 0;

	${p => p.$shown && 'opacity: 1;'}
`;

const PulseOrb = styled.div`
	width: 50px; height: 50px;

	&:before {
		content: '';
		position: relative;
		display: block;
		width: 250px; height: 250px;
		box-sizing: border-box;
		margin-left: -100px;
		margin-top: -100px;
		border-radius: 100%;
		background-color: ${p => p.theme.ui.primaryFill};
		animation: ${pulseRing} 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
	}
	&:after {
		content: '';
		display: block;
		position: relative;
		background-size: 45px;
		background-position: center;
		background-repeat: no-repeat;
		background-image: url('images/logo.svg');
		opacity: .8;
		margin-top: -150px;
		width: 50px; height: 50px;
	}
`;

export default FlightInProgress;
