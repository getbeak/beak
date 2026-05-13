import { actions as omniBarActions } from '@beak/ui/features/omni-bar/store';
import { useAppSelector } from '@beak/ui/store/redux';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { faCaretLeft, faCaretRight, faLock, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import {
	useNavigateFlightHistoryForSelectedTab,
	useSelectedTabFlightRequirements,
} from '../../../services/flight/tab-integration';
import ArbiterBadge from '../../arbiter/components/ArbiterBadge';
import { showEncryptionView } from '../../encryption/store/actions';
import ActionBarButton from './atoms/ActionBarButton';
import ActionBarSeparator from './atoms/ActionBarSeparator';
import ActionBarVersion from './atoms/ActionBarVersion';
import ActionBarAlertButton from './molecules/ActionBarAlertButton';
import ActionBarFlightStatus from './molecules/ActionBarFlightStatus';

const ActionBar: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();

	// Use new tab-integrated flight hooks
	const requirements = useSelectedTabFlightRequirements();
	const { goToNext, goToPrevious } = useNavigateFlightHistoryForSelectedTab();

	return (
		<Wrapper>
			<Spacer>
				<ArbiterBadge />
			</Spacer>
			<Spacer>
				<ActionBarVersion />
			</Spacer>
			<ActionBarButton id={'tt-action-bar-encryption-button'} onClick={() => dispatch(showEncryptionView())}>
				<FontAwesomeIcon color={'var(--beak-colors-fg-muted)'} size={'1x'} icon={faLock} />
			</ActionBarButton>
			<ActionBarSeparator />
			<ActionBarButton
				id={'tt-action-bar-previous-flight-history'}
				disabled={!requirements?.canGoBack}
				onClick={goToPrevious}
			>
				<FontAwesomeIcon color={'var(--beak-colors-fg-muted)'} size={'lg'} icon={faCaretLeft} />
			</ActionBarButton>
			<ActionBarFlightStatus />
			<ActionBarButton id={'tt-action-bar-next-flight-history'} disabled={!requirements?.canGoForward} onClick={goToNext}>
				<FontAwesomeIcon color={'var(--beak-colors-fg-muted)'} size={'lg'} icon={faCaretRight} />
			</ActionBarButton>
			<ActionBarSeparator />
			<ActionBarAlertButton id={'tt-action-bar-alert-button'} />
			<ActionBarButton
				data-tooltip-id={'tt-action-bar-omni-search'}
				data-tooltip-content={`Open search bar (${renderPlainTextDefinition('omni-bar.launch.finder')})`}
				onClick={() => dispatch(omniBarActions.showOmniBar({ mode: 'search' }))}
			>
				<FontAwesomeIcon color={'var(--beak-colors-fg-muted)'} size={'1x'} icon={faSearch} />
			</ActionBarButton>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	display: flex;
	justify-content: flex-end;
	align-items: center;
	height: 40px;

	-webkit-app-region: drag;
	background-color: var(--beak-colors-bg-surface-emphasized);
	padding: 0 10px;

	> * {
		-webkit-app-region: no-drag;
	}
`;

const Spacer = styled.div`
	margin: 0 3px;
`;

export default ActionBar;
