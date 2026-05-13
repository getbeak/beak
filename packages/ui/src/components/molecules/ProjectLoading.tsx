import { Box, Flex, Image } from '@chakra-ui/react';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import * as React from 'react';
import { useState } from 'react';

const ProjectLoading: React.FC = () => {
	const hints: string[] = [
		`You can collapse the sidebar by clicking the same icon again, or pressing ${renderPlainTextDefinition('sidebar.toggle-view')}`,
		'You can use variables to make request bodies more dynamic',
		`Use the command bar to get around Beak quickly... ${renderPlainTextDefinition('omni-bar.launch.commands')}`,
		`Use the finder bar to get around Beak quickly... ${renderPlainTextDefinition('omni-bar.launch.finder')}`,
		'Keep an eye out for easter eggs...',
		`Quickly run a request from anywhere by pressing ${renderPlainTextDefinition('global.execute-request')}`,
		'Check out the preferences to customize Beak to your liking',
		'Beak supports GraphQL, helping you write queries and inject variables',
	];

	const [hintIndex] = useState<number>(() => Math.floor(Math.random() * hints.length));

	return (
		<Flex
			position='absolute'
			inset='0'
			zIndex={100}
			align='center'
			justify='center'
			textAlign='center'
			bg='bg.canvas'
			style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
		>
			<Box>
				<Image
					w='60px'
					src='images/logo-tile.png'
					mb='5'
					filter='drop-shadow(0px 8px 24px var(--beak-colors-fg-default)44)'
				/>
				<Box textTransform='uppercase' fontSize='md' fontWeight='bold'>
					{'Did you know?'}
				</Box>
				<Box mx='10' mt='1' maxW='250px' fontSize='md' lineHeight='18px'>
					{hints[hintIndex]}
				</Box>
			</Box>
		</Flex>
	);
};

export default ProjectLoading;
