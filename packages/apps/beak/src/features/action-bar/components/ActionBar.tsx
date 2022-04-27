import React from 'react';
import { useDispatch } from 'react-redux';
import { actions as omniBarActions } from '@beak/app-beak/features/omni-bar/store';
import { actions as flightActions } from '@beak/app-beak/store/flight';
import { useAppSelector } from '@beak/app-beak/store/redux';
import { TypedObject } from '@beak/shared-common/helpers/typescript';
import { Nodes } from '@beak/shared-common/types/beak-project';
import {
	faCaretLeft,
	faCaretRight,
	faLock,
	faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

import { showEncryptionView } from '../../encryption/store/actions';
import ActionBarButton from './atoms/ActionBarButton';
import ActionBarSeparator from './atoms/ActionBarSeparator';
import ActionBarVersion from './atoms/ActionBarVersion';
import ActionBarAlertButton from './molecules/ActionBarAlertButton';
import ActionBarFlightStatus from './molecules/ActionBarFlightStatus';

const ActionBar: React.FC<React.PropsWithChildren<unknown>> = () => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const request = useAppSelector(s => s.global.project.tree![selectedTabPayload ?? 'non_existent']);
	const requirements = useRequirements(selectedTabPayload, request);

	return (
		<Wrapper>
			<ActionBarVersion />
			<ActionBarButton onClick={() => dispatch(showEncryptionView())}>
				<FontAwesomeIcon
					color={theme.ui.textMinor}
					size={'1x'}
					icon={faLock}
				/>
			</ActionBarButton>
			<ActionBarSeparator />
			<abbr title={'Go to previous item in flight history'}>
				<ActionBarButton
					disabled={!requirements?.canGoBack}
					onClick={() => dispatch(flightActions.previousFlightHistory({ requestId: selectedTabPayload! }))}
				>
					<FontAwesomeIcon
						color={theme.ui.textMinor}
						size={'lg'}
						icon={faCaretLeft}
					/>
				</ActionBarButton>
			</abbr>
			<ActionBarFlightStatus />
			<abbr title={'Go to next item in flight history'}>
				<ActionBarButton
					disabled={!requirements?.canGoForward}
					onClick={() => dispatch(flightActions.nextFlightHistory({ requestId: selectedTabPayload! }))}
				>
					<FontAwesomeIcon
						color={theme.ui.textMinor}
						size={'lg'}
						icon={faCaretRight}
					/>
				</ActionBarButton>
			</abbr>
			<ActionBarSeparator />
			<abbr title={'Shows possible errors with your project'}>
				<ActionBarAlertButton />
			</abbr>
			<abbr title={'Go bird watching'}>
				<ActionBarButton onClick={() => dispatch(omniBarActions.showOmniBar({ mode: 'search' }))}>
					<FontAwesomeIcon
						color={theme.ui.textMinor}
						size={'1x'}
						icon={faSearch}
					/>
				</ActionBarButton>
			</abbr>
		</Wrapper>
	);
};

function useRequirements(selectedRequestId: string | undefined, request: Nodes | undefined) {
	const flight = useAppSelector(s => s.global.flight.flightHistory[selectedRequestId ?? 'non_existent']);

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
	justify-content: flex-end;
	align-items: center;
	height: 40px;

	-webkit-app-region: drag;
	background-color: ${props => props.theme.ui.secondarySurface};
	padding: 0 10px;
`;

export default ActionBar;
