import Button from '@beak/app/src/components/atoms/Button';
import { Flight } from '@beak/app/src/store/flight/types';
import { faCaretSquareLeft, faCaretSquareRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled, { useTheme } from 'styled-components';

export interface FlightHistorySelectorProps {
	flightHistory: Flight[];
	selectedFlightIndex: number;
	updateSelectedFlight: (index: number) => void;
}

const FlightHistorySelector: React.FunctionComponent<FlightHistorySelectorProps> = props => {
	const theme = useTheme();
	const { flightHistory, selectedFlightIndex, updateSelectedFlight } = props;
	const hasNext = selectedFlightIndex > 0;
	const hasPrev = flightHistory.length > selectedFlightIndex + 1;

	return (
		<Wrapper>
			<ButtonLeft
				disabled={!hasPrev}
				onClick={() => updateSelectedFlight(selectedFlightIndex + 1)}
			>
				<FontAwesomeIcon
					color={theme.ui.primaryFill}
					icon={faCaretSquareLeft}
				/>
			</ButtonLeft>
			<ButtonRight
				disabled={!hasNext}
				onClick={() => updateSelectedFlight(selectedFlightIndex - 1)}
			>
				<FontAwesomeIcon
					color={theme.ui.primaryFill}
					icon={faCaretSquareRight}
				/>
			</ButtonRight>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: absolute;
	top: 10px;
	left: 10px;
`;

const ButtonLeft = styled(Button)`
	border-width: 1px;
	border-top-right-radius: 0;
	border-bottom-right-radius: 0;
`;

const ButtonRight = styled(Button)`
	border-width: 1px;
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
`;

export default FlightHistorySelector;
