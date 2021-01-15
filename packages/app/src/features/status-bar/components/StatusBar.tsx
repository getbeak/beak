import { tabSelected } from '@beak/app/store/project/actions';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import StatusBarContainer from './atoms/StatusBarContainer';

const StatusBar: React.FunctionComponent = () => {
	const currentFlight = useSelector(s => s.global.flight.currentFlight);
	const dispatch = useDispatch();

	function generatePercentage() {
		if (!currentFlight?.contentLength)
			return '0%';

		const percent = currentFlight?.bodyTransferPercentage || 0;
		const rounded = Math.round(percent * 100 + Number.EPSILON) / 100;

		return `${rounded}%`;
	}

	function visitCurrentFlight() {
		if (!currentFlight)
			return;

		dispatch(tabSelected({
			type: 'request',
			payload: currentFlight.requestId,
			temporary: true,
		}));
	}

	// TODO(afr): Reset status from resource success after 2 seconds?

	return (
		<StatusBarContainer>
			<Wrapper onDoubleClick={() => visitCurrentFlight()}>
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
