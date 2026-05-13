import { Box, Flex } from '@chakra-ui/react';
import { actions as omniBarActions } from '@beak/ui/features/omni-bar/store';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { faCaretLeft, faCaretRight, faLock, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useDispatch } from 'react-redux';

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

const ActionBar: React.FC = () => {
	const dispatch = useDispatch();

	const requirements = useSelectedTabFlightRequirements();
	const { goToNext, goToPrevious } = useNavigateFlightHistoryForSelectedTab();

	return (
		<Flex
			as='div'
			align='center'
			justify='flex-end'
			h='40px'
			px='3'
			bg='bg.surface.emphasized'
			gap='0.5'
			style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
			css={{ '& > *': { WebkitAppRegion: 'no-drag' } as React.CSSProperties }}
		>
			<Box mx='1'><ArbiterBadge /></Box>
			<Box mx='1'><ActionBarVersion /></Box>
			<ActionBarButton id='tt-action-bar-encryption-button' onClick={() => dispatch(showEncryptionView())}>
				<FontAwesomeIcon color='var(--beak-colors-fg-muted)' size='1x' icon={faLock} />
			</ActionBarButton>
			<ActionBarSeparator />
			<ActionBarButton
				id='tt-action-bar-previous-flight-history'
				disabled={!requirements?.canGoBack}
				onClick={goToPrevious}
			>
				<FontAwesomeIcon color='var(--beak-colors-fg-muted)' size='lg' icon={faCaretLeft} />
			</ActionBarButton>
			<ActionBarFlightStatus />
			<ActionBarButton
				id='tt-action-bar-next-flight-history'
				disabled={!requirements?.canGoForward}
				onClick={goToNext}
			>
				<FontAwesomeIcon color='var(--beak-colors-fg-muted)' size='lg' icon={faCaretRight} />
			</ActionBarButton>
			<ActionBarSeparator />
			<ActionBarAlertButton id='tt-action-bar-alert-button' />
			<ActionBarButton
				data-tooltip-id='tt-action-bar-omni-search'
				data-tooltip-content={`Open search bar (${renderPlainTextDefinition('omni-bar.launch.finder')})`}
				onClick={() => dispatch(omniBarActions.showOmniBar({ mode: 'search' }))}
			>
				<FontAwesomeIcon color='var(--beak-colors-fg-muted)' size='1x' icon={faSearch} />
			</ActionBarButton>
		</Flex>
	);
};

export default ActionBar;
