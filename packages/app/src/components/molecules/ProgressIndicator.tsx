import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import binaryStore from '../../lib/binary-store';

const ProgressIndicator: React.FunctionComponent = () => {
	const currentFlight = useSelector(s => s.global.flight.currentFlight);

	// TODO(afr): Reinstate this

	return (
		<Wrapper>
			{currentFlight?.flighting && (
				<IndicatorBar progress={0} />
			)}
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: relative;
	height: 4px;
`;

const IndicatorBar = styled.div<{ progress: number }>`
	position: absolute;
	top: 0;
	left: 0;
	z-index: 101;

	width: ${props => props.progress}%;
	height: 4px;

	background-color: ${props => props.theme.ui.primaryFill};
`;

export default ProgressIndicator;
