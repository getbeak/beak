import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useDefaultOrCreateRequest } from '../../../hooks/use-default-or-create-request';
import { useAppSelector } from '../../../store/redux';
import { actions as cloneRepoActions } from '../../clone-repo/store';
import Hero from './molecules/Hero';
import LearnGrid from './molecules/LearnGrid';
import ManageGrid from './molecules/ManageGrid';
import QuickActions from './molecules/QuickActions';
import RecentsList from './molecules/RecentsList';

const embedded = Boolean(window.embeddedIndicator);

type Section = 'manage' | 'start' | 'recents' | 'learn';

const WelcomeScreen: React.FC = () => {
	const dispatch = useDispatch();
	const defaultOrCreateRequest = useDefaultOrCreateRequest();
	const mode = useAppSelector(s => s.global.project.mode);

	const hasProject = mode !== 'none';
	const order = resolveOrder(mode);

	return (
		<Box position='relative' h='100%' w='100%' bg='bg.canvas' overflowY='auto'>
			<Flex direction='column' align='stretch' maxW='960px' mx='auto' px={{ base: '5', md: '8' }} py='6' gap='6'>
				<Hero onPrimary={defaultOrCreateRequest} />

				{order.map(section => {
					switch (section) {
						case 'manage':
							return hasProject ? <ManageGrid key='manage' /> : null;
						case 'start':
							return (
								<QuickActions
									key='start'
									embedded={embedded}
									cloneEnabled
									onCloneRequested={() => dispatch(cloneRepoActions.start())}
								/>
							);
						case 'recents':
							return <RecentsList key='recents' embedded={embedded} />;
						case 'learn':
							return <LearnGrid key='learn' />;
						default:
							return null;
					}
				})}
			</Flex>
		</Box>
	);
};

function resolveOrder(mode: 'none' | 'memory' | 'disk'): Section[] {
	// Disk-backed project: surface "Edit this project" first.
	if (mode === 'disk') return ['manage', 'start', 'recents', 'learn'];

	// Untitled scratch project: leave Start at the top with Learn underneath —
	// the user is most likely orienting, not picking up where they left off.
	if (mode === 'memory') return ['start', 'learn', 'recents', 'manage'];

	// No project loaded (welcome window fallback).
	return ['start', 'recents', 'learn'];
}

export default WelcomeScreen;
