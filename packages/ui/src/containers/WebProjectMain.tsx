import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';

import AgentStatusBanner from '../components/molecules/AgentStatusBanner';
import MeshGradient from '../components/molecules/MeshGradient';
import WebMenuBar from '../features/menu-bar/components/WebMenuBar';
import ProjectMain from './ProjectMain';

/**
 * Web host shell. Wraps ProjectMain in a fullscreen Flex with one static
 * mesh-gradient backdrop. The mesh sits behind every layer (menu bar,
 * sidebar, content) and peeks through translucent surfaces — this is what
 * stands in for the BrowserWindow's native vibrancy on electron.
 *
 * The route is the only thing that varies: `/` is the empty workbench
 * (no project bound — `useProjectBootstrap` reads the bare path and
 * dispatches the welcome-tab seed), `/project/:projectId` mounts a real
 * project from the in-browser filesystem. Both render the exact same shell.
 */
const WebProjectMain: React.FC = () => (
	<Flex position='relative' h='100vh' w='100vw' overflow='hidden' direction='column' bg='bg.canvas'>
		<Box
			position='absolute'
			inset='0'
			zIndex={0}
			pointerEvents='none'
			css={{ opacity: 0.4, '.dark &': { opacity: 0.65 } }}
		>
			<MeshGradient static tone='welcome' intensity='subtle' position='absolute' inset='0' />
		</Box>

		<Box position='relative' zIndex={1}>
			<WebMenuBar />
		</Box>
		<Box position='relative' zIndex={1}>
			<AgentStatusBanner />
		</Box>
		<Box flex='1' minH='0' position='relative' zIndex={1}>
			<ProjectMain />
		</Box>
	</Flex>
);

export default WebProjectMain;
