import { actions } from '@beak/app/store/flight';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { Nodes } from '@beak/common/dist/types/beak-project';
import {
	faCaretLeft,
	faCaretRight,
	faKiwiBird,
	faRing,
	faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

import ActionBarIcon from './atoms/ActionBarIcon';
import ActionBarSeperator from './atoms/ActionBarSeperator';

const ActionBar: React.FunctionComponent = () => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const selectedTabPayload = useSelector(s => s.global.project.selectedTabPayload);
	const request = useSelector(s => s.global.project.tree![selectedTabPayload ?? 'non_existent']);
	const requirements = gatherRequirements(selectedTabPayload, request);

	return (
		<Wrapper>
			<ActionBarIcon disabled>
				<FontAwesomeIcon
					color={theme.ui.textMinor}
					size={'1x'}
					icon={faRing}
				/>
			</ActionBarIcon>
			<ActionBarIcon disabled>
				<FontAwesomeIcon
					color={theme.ui.textMinor}
					size={'1x'}
					icon={faKiwiBird}
				/>
			</ActionBarIcon>
			<ActionBarSeperator />
			<abbr title={'Go to previous item in flight history'}>
				<ActionBarIcon
					disabled={!requirements?.canGoBack}
					onClick={() => dispatch(actions.previousFlightHistory({ requestId: selectedTabPayload! }))}
				>
					<FontAwesomeIcon
						color={theme.ui.textMinor}
						size={'lg'}
						icon={faCaretLeft}
					/>
				</ActionBarIcon>
			</abbr>
			<abbr title={'Go to next item in flight history'}>
				<ActionBarIcon
					disabled={!requirements?.canGoForward}
					onClick={() => dispatch(actions.nextFlightHistory({ requestId: selectedTabPayload! }))}
				>
					<FontAwesomeIcon
						color={theme.ui.textMinor}
						size={'lg'}
						icon={faCaretRight}
					/>
				</ActionBarIcon>
			</abbr>
			<ActionBarSeperator />
			<abbr title={'Go bird watching'}>
				<ActionBarIcon>
					<FontAwesomeIcon
						color={theme.ui.textMinor}
						size={'1x'}
						icon={faSearch}
					/>
				</ActionBarIcon>
			</abbr>
		</Wrapper>
	);
};

function gatherRequirements(selectedRequestId: string | undefined, request: Nodes | undefined) {
	const flight = useSelector(s => s.global.flight.flightHistory[selectedRequestId ?? 'non_existent']);

	if (!request)
		return null;

	if (!flight)
		return null;

	const keys = TypedObject.keys(flight.history);
	const selectedIndex = keys.findIndex(i => i === flight.selected);

	return {
		canGoBack: selectedIndex > 0,
		canGoForward: selectedIndex < keys.length - 1,
		canExecute: true,
	};
}

const Wrapper = styled.div`
	display: flex;
	height: 40px;
	-webkit-app-region: drag;
	background-color: ${props => props.theme.ui.secondarySurface};
	justify-content: flex-end;
	align-items: center;
	padding: 0 10px;
`;

export default ActionBar;
