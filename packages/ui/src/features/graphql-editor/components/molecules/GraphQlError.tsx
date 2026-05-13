import { Box, Flex, Link } from '@chakra-ui/react';
import { ipcWindowService } from '@beak/ui/lib/ipc';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { CloudLightning, Lightbulb } from 'lucide-react';
import * as React from 'react';

interface GraphQlErrorProps {
	error: Error;
}

const GraphQlError: React.FC<GraphQlErrorProps> = ({ error }) => (
	<Flex
		direction='column'
		textAlign='center'
		px='10'
		py='12'
		h='calc(100% - 120px)'
		maxW='600px'
		mx='auto'
		align='center'
		css={{ 'svg > path': { fill: 'var(--beak-colors-fg-muted)' } }}
	>
		<CloudLightning opacity={0.4} />
		<Box fontSize='xl' my='2.5' fontWeight='300' color='fg.default'>
			{'Unable to fetch GraphQL schema'}
		</Box>
		<Box fontSize='md' color='fg.muted' overflowWrap='anywhere'>
			{'Error message: '}
			{error.message}
		</Box>
		<Box w='250px' h='1px' my='5' bg='border.default' />
		<Box fontSize='md' color='fg.muted'>
			{'You can try the troubleshooting points below, but if that fails to '}
			{'resolve the issue, you can view more details in the developer tools '}
			{'network tab.'}
		</Box>
		<Box as='ul' listStyleType='none'>
			<Box as='li' fontSize='sm' m='1.5' color='fg.muted'>
				<Lightbulb opacity={0.6} />
				{' Check the URL is correct'}
			</Box>
			<Box as='li' fontSize='sm' m='1.5' color='fg.muted'>
				<Lightbulb opacity={0.6} />
				{' Check that any security headers are provided'}
			</Box>
			<Box as='li' fontSize='sm' m='1.5' color='fg.muted'>
				<Lightbulb opacity={0.6} />
				{' Check the HTTP method/verb is correct'}
			</Box>
			<Box as='li' fontSize='sm' m='1.5' color='fg.muted'>
				<Lightbulb opacity={0.6} />
				{` Toggle developer tools from the command search bar ${renderPlainTextDefinition('omni-bar.launch.commands')}`}
			</Box>
			<Box as='li' fontSize='sm' m='1.5' color='fg.muted'>
				<Lightbulb opacity={0.6} />
				{' Toggle developer tools by clicking '}
				<Link
					href='#'
					color='accent.pink'
					onClick={event => {
						event.preventDefault();
						event.stopPropagation();
						ipcWindowService.toggleDeveloperTools();
					}}
				>
					{'here'}
				</Link>
			</Box>
		</Box>
	</Flex>
);

export default GraphQlError;
