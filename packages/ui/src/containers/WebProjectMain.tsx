import { Box, Flex, Spinner } from '@chakra-ui/react';
import { ipcFsService, ipcProjectService } from '@beak/ui/lib/ipc';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import MeshGradient from '../components/molecules/MeshGradient';
import ProjectMain from './ProjectMain';

type BootState = 'checking' | 'ready' | 'creating';

/**
 * Web host shell. Wraps ProjectMain in a fullscreen Flex.
 *
 * Cold boot: when the route's `projectId` doesn't resolve to a real project
 * on the in-browser filesystem (e.g. the user landed on `/project/default`
 * via the root redirect), we create a fresh project, get its KSUID, and
 * replace-navigate to `/project/<ksuid>` so subsequent boots land directly.
 */
const WebProjectMain: React.FC = () => {
	const { projectId } = useParams<{ projectId: string }>();
	const [state, setState] = useState<BootState>('checking');

	useEffect(() => {
		let cancelled = false;

		async function bootstrap() {
			if (!projectId) return;

			let exists = false;
			try {
				exists = await ipcFsService.pathExists('project.json');
			} catch {
				exists = false;
			}

			if (cancelled) return;

			if (exists) {
				setState('ready');
				return;
			}

			setState('creating');
			try {
				await ipcProjectService.createProject({ projectName: 'My project' });
				// createProject reassigns window.location after creation; nothing else to do.
			} catch (err) {
				console.warn('[WebProjectMain] failed to create default project', err);
				if (!cancelled) setState('ready');
			}
		}

		bootstrap();

		return () => {
			cancelled = true;
		};
	}, [projectId]);

	if (state !== 'ready') {
		return (
			<Box position='relative' h='100vh' w='100vw' bg='bg.canvas' overflow='hidden'>
				<MeshGradient position='absolute' inset='0' tone='loading' intensity='normal' pointerEvents='none' />
				<Flex
					position='relative'
					h='100%'
					w='100%'
					align='center'
					justify='center'
					direction='column'
					gap='4'
				>
					<Flex
						align='center'
						justify='center'
						w='64px'
						h='64px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)'
						boxShadow='0 0 32px color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
					>
						<Spinner size='lg' color='accent.pink' />
					</Flex>
					<Flex direction='column' align='center' gap='1'>
						<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
							{state === 'creating' ? 'Creating your first project…' : 'Loading Beak…'}
						</Box>
						<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='fg.subtle'>
							{state === 'creating' ? 'Setting up the workspace' : 'Initialising'}
						</Box>
					</Flex>
				</Flex>
			</Box>
		);
	}

	return (
		<Flex h='100vh' w='100vw' overflow='hidden'>
			<ProjectMain />
		</Flex>
	);
};

export default WebProjectMain;
