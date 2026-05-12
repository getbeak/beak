import { useAppSelector } from '@beak/ui/store/redux';
import React from 'react';
import styled from 'styled-components';

const ProgressIndicator: React.FC<React.PropsWithChildren<unknown>> = () => {
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const activeFlight = useAppSelector(s => (selectedTab ? s.global.flight.activeFlights[selectedTab] : undefined));

	const percentage = activeFlight?.bodyTransferPercentage ?? 0;

	return <Wrapper>{activeFlight && <IndicatorBar style={{ width: `${percentage}%` }} />}</Wrapper>;
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
