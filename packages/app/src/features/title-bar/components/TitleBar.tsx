import BeakHubContext from '@beak/app/contexts/beak-hub-context';
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

import TitleBarIcon from './atoms/TitleBarIcon';
import TitleBarSeperator from './atoms/TitleBarSeperator';

const TitleBar: React.FunctionComponent = () => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const selectedRequest = useSelector(s => s.global.project.selectedRequest);
	const request = useSelector(s => s.global.project.tree![selectedRequest ?? 'non_existent']);
	const requirements = gatherRequirements(selectedRequest, request);

	return (
		<Wrapper>
			<TitleBarIcon disabled>
				<FontAwesomeIcon
					color={theme.ui.textMinor}
					size={'1x'}
					icon={faRing}
				/>
			</TitleBarIcon>
			<TitleBarIcon disabled>
				<FontAwesomeIcon
					color={theme.ui.textMinor}
					size={'1x'}
					icon={faKiwiBird}
				/>
			</TitleBarIcon>
			<TitleBarSeperator />
			<abbr title={'Go to previous item in flight history'}>
				<TitleBarIcon
					disabled={!requirements?.canGoBack}
					onClick={() => dispatch(actions.previousFlightHistory({ requestId: selectedRequest! }))}
				>
					<FontAwesomeIcon
						color={theme.ui.textMinor}
						size={'lg'}
						icon={faCaretLeft}
					/>
				</TitleBarIcon>
			</abbr>
			<abbr title={'Go to next item in flight history'}>
				<TitleBarIcon
					disabled={!requirements?.canGoForward}
					onClick={() => dispatch(actions.nextFlightHistory({ requestId: selectedRequest! }))}
				>
					<FontAwesomeIcon
						color={theme.ui.textMinor}
						size={'lg'}
						icon={faCaretRight}
					/>
				</TitleBarIcon>
			</abbr>
			<TitleBarSeperator />
			<abbr title={'Go bird watching'}>
				<TitleBarIcon>
					<FontAwesomeIcon
						color={theme.ui.textMinor}
						size={'1x'}
						icon={faSearch}
					/>
				</TitleBarIcon>
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

	// console.log({
	// 	keys,
	// 	selectedIndex,
	// 	canGoBack: selectedIndex < keys.length - 1,
	// 	canGoForward: selectedIndex > 0,
	// 	canExecute: true,
	// });

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

export default TitleBar;
