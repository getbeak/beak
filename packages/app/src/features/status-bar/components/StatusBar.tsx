import binaryStore from '@beak/app/src/lib/binary-store';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import StatusBarContainer from './atoms/StatusBarContainer';

const StatusBar: React.FunctionComponent = () => {
	const currentFlight = useSelector(s => s.global.flight.currentFlight);

	function generatePercentage() {
		if (!currentFlight?.contentLength)
			return '0%';

		const store = binaryStore.get(currentFlight.binaryStoreKey);
		const percent = (store.length / currentFlight.contentLength) * 100;
		const rounded = Math.round(percent * 100 + Number.EPSILON) / 100;

		return `${rounded}%`;
	}

	// TODO(afr): Reset status from resource success after 2 seconds?

	return (
		<StatusBarContainer>
			<Wrapper>
				{!currentFlight && 'waiting... 🤔'}
				{currentFlight?.flighting && `request in progress... (${generatePercentage()})`}
				{currentFlight?.response && `request response (${currentFlight.response.status})`}
			</Wrapper>
		</StatusBarContainer>
	);
};

export default StatusBar;

const Wrapper = styled.div`
	background-color: ${props => props.theme.ui.primaryFill};
	height: 24px;

	line-height: 24px;
	color: ${props => props.theme.ui.textOnSurfaceBackground};
	font-size: 12px;

	padding: 0 10px;
`;
