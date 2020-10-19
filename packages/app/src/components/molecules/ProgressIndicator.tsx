import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

const ProgressIndicator: React.FunctionComponent = () => {
	const currentFlight = useSelector(s => s.global.flight.currentFlight);

	return (
		<Wrapper>
			{currentFlight?.flighting && (
				<IndicatorBar
					style={{ width: `${currentFlight.bodyTransferPercentage || 0}%` }}
				/>
			)}
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: relative;
	height: 4px;
`;

const IndicatorBar = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	z-index: 101;

	transition: width .1s ease;
	height: 4px;

	background-color: ${props => props.theme.ui.primaryFill};
`;

export default ProgressIndicator;
