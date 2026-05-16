import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';

import { useDefaultOrCreateRequest } from '../../../hooks/use-default-or-create-request';
import Hero from './molecules/Hero';
import LearnGrid from './molecules/LearnGrid';
import QuickActions from './molecules/QuickActions';
import RecentsList from './molecules/RecentsList';

const embedded = Boolean(window.embeddedIndicator);

const WelcomeScreen: React.FC = () => {
	const defaultOrCreateRequest = useDefaultOrCreateRequest();

	return (
		<Box position='relative' h='100%' w='100%' bg='bg.canvas' overflowY='auto'>
			<Flex direction='column' align='stretch' maxW='960px' mx='auto' px={{ base: '5', md: '8' }} py='10' gap='10'>
				<Hero onPrimary={defaultOrCreateRequest} />

				<Box>
					<QuickActions
						embedded={embedded}
						cloneEnabled={false}
						onCloneRequested={() => {
							/* placeholder — wired in Phase 5 (clone flow) */
						}}
					/>
				</Box>

				<RecentsList embedded={embedded} />

				<LearnGrid />
			</Flex>
		</Box>
	);
};

export default WelcomeScreen;
