import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { actions as omniBarActions } from '@beak/app/features/omni-bar/store';
import shortcutDefinitions from '@beak/app/lib/keyboard-shortcuts';
import { actions as flightActions } from '@beak/app/store/flight';
import { useAppSelector } from '@beak/app/store/redux';
import { renderPlainTextDefinition } from '@beak/app/utils/keyboard-rendering';
import { TypedObject } from '@beak/common/helpers/typescript';
import {
	faCaretLeft,
	faCaretRight,
	faLock,
	faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Nodes } from '@getbeak/types/nodes';
import styled, { useTheme } from 'styled-components';

import ArbiterBadge from '../../arbiter/components/ArbiterBadge';
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
	const windowContext = useContext(WindowSessionContext)!;
	const omniBarDefinition = (() => {
		const shortcutDefinition = shortcutDefinitions['omni-bar.launch.finder'];

		if (shortcutDefinition.type === 'agnostic')
			return shortcutDefinition;

		return shortcutDefinition[windowContext.getPlatform()];
	})();

	return (
		<Wrapper>
			<Spacer><ArbiterBadge /></Spacer>
			<Spacer><ActionBarVersion /></Spacer>
			<ActionBarButton id={'tt-action-bar-encryption-button'} onClick={() => dispatch(showEncryptionView())}>
				<FontAwesomeIcon
					color={theme.ui.textMinor}
					size={'1x'}
					icon={faLock}
				/>
			</ActionBarButton>
			<ActionBarSeparator />
			<ActionBarButton
				id={'tt-action-bar-previous-flight-history'}
				disabled={!requirements?.canGoBack}
				onClick={() => dispatch(flightActions.previousFlightHistory({ requestId: selectedTabPayload! }))}
			>
				<FontAwesomeIcon
					color={theme.ui.textMinor}
					size={'lg'}
					icon={faCaretLeft}
				/>
			</ActionBarButton>
			<ActionBarFlightStatus />
			<ActionBarButton
				id={'tt-action-bar-next-flight-history'}
				disabled={!requirements?.canGoForward}
				onClick={() => dispatch(flightActions.nextFlightHistory({ requestId: selectedTabPayload! }))}
			>
				<FontAwesomeIcon
					color={theme.ui.textMinor}
					size={'lg'}
					icon={faCaretRight}
				/>
			</ActionBarButton>
			<ActionBarSeparator />
			<ActionBarAlertButton id={'tt-action-bar-alert-button'} />
			<ActionBarButton
				data-tooltip-id={'tt-action-bar-omni-search'}
				data-tooltip-content={`Open search bar (${renderPlainTextDefinition(omniBarDefinition)})`}
				onClick={() => dispatch(omniBarActions.showOmniBar({ mode: 'search' }))}
			>
				<FontAwesomeIcon
					color={theme.ui.textMinor}
					size={'1x'}
					icon={faSearch}
				/>
			</ActionBarButton>
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

	> * {
		-webkit-app-region: no-drag;
	}
`;

const Spacer = styled.div`
	margin: 0 3px;
`;

export default ActionBar;
