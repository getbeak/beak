import BeakTooltip from '@beak/ui/components/atoms/BeakTooltip';
import { actions as omniBarActions } from '@beak/ui/features/omni-bar/store';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { Box, Flex } from '@chakra-ui/react';
import { Lock, Search } from 'lucide-react';

import React from 'react';
import { useDispatch } from 'react-redux';

import { showEncryptionView } from '../../encryption/store/actions';
import ActionBarButton from './atoms/ActionBarButton';
import ActionBarVersion from './atoms/ActionBarVersion';

interface ActionBarProps {
	/** When true, the bar renders as a slim inline strip (no bg, no
	 *  draggable region) for merging into the tab bar on the web host. */
	inline?: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({ inline }) => {
	const dispatch = useDispatch();

	return (
		<Flex
			as='div'
			role='toolbar'
			aria-label='Action bar'
			align='center'
			justify='flex-end'
			h={inline ? '34px' : '40px'}
			px={inline ? '2' : '3'}
			bg={inline ? 'transparent' : 'bg.surface.emphasized'}
			gap='1'
			style={inline ? undefined : ({ WebkitAppRegion: 'drag' } as React.CSSProperties)}
			css={inline ? undefined : { '& > *': { WebkitAppRegion: 'no-drag' } as React.CSSProperties }}
		>
			{!inline && (
				<Box mx='1'>
					<ActionBarVersion />
				</Box>
			)}

			<BeakTooltip content='View project encryption'>
				<ActionBarButton aria-label='View project encryption' onClick={() => dispatch(showEncryptionView())}>
					<Lock size={13} />
				</ActionBarButton>
			</BeakTooltip>

			<BeakTooltip content={`Search (${renderPlainTextDefinition('omni-bar.launch.finder')})`}>
				<ActionBarButton
					aria-label='Open omni search bar'
					onClick={() => dispatch(omniBarActions.showOmniBar({ mode: 'search' }))}
				>
					<Search size={14} />
				</ActionBarButton>
			</BeakTooltip>
		</Flex>
	);
};

export default ActionBar;
