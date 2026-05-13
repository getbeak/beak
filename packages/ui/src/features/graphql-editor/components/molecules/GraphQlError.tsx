import { Box, Flex, Link } from '@chakra-ui/react';
import { ipcWindowService } from '@beak/ui/lib/ipc';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { CloudLightning, Lightbulb } from 'lucide-react';
import * as React from 'react';

interface GraphQlErrorProps {
	error: Error;
}

const HINTS: Array<string | React.ReactNode> = [
	'Check the URL is correct',
	'Check that any security headers are provided',
	'Check the HTTP method/verb is correct',
];

const GraphQlError: React.FC<GraphQlErrorProps> = ({ error }) => (
	<Flex
		direction='column'
		px='6'
		py='10'
		h='100%'
		maxW='560px'
		mx='auto'
		align='center'
		justify='center'
		gap='3'
		textAlign='center'
	>
		<Flex
			align='center'
			justify='center'
			w='52px'
			h='52px'
			borderRadius='full'
			bg='color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
			color='accent.alert'
			mb='1'
			boxShadow='0 8px 24px color-mix(in srgb, var(--beak-colors-accent-alert) 22%, transparent)'
		>
			<CloudLightning size={26} strokeWidth={1.8} />
		</Flex>

		<Flex direction='column' gap='1'>
			<Box fontSize='md' fontWeight='600' color='fg.default'>
				{'Unable to fetch GraphQL schema'}
			</Box>
			<Box fontSize='10px' color='fg.subtle' letterSpacing='0.06em' textTransform='uppercase' fontWeight='700'>
				{'Introspection failed'}
			</Box>
		</Flex>

		<Box
			w='100%'
			mt='1'
			p='2.5'
			borderRadius='md'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, var(--beak-colors-border-subtle))'
			bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, var(--beak-colors-bg-surface))'
			fontFamily='mono'
			fontSize='xs'
			color='fg.default'
			textAlign='left'
			overflowWrap='anywhere'
		>
			<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='accent.alert' mb='1' fontFamily='body'>
				{'Error message'}
			</Box>
			{error.message}
		</Box>

		<Box
			w='100%'
			mt='2'
			p='3'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 70%, transparent)'
			textAlign='left'
		>
			<Flex align='center' gap='1.5' mb='2' color='accent.warning'>
				<Lightbulb size={12} strokeWidth={2.2} />
				<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
					{'Troubleshooting'}
				</Box>
			</Flex>
			<Flex direction='column' gap='1' as='ul' listStyleType='none' fontSize='xs' color='fg.muted'>
				{HINTS.map(hint => (
					<Box as='li' key={String(hint)} pl='4' position='relative'>
						<Box position='absolute' left='0' top='5px' w='4px' h='4px' borderRadius='full' bg='color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)' />
						{hint}
					</Box>
				))}
				<Box as='li' pl='4' position='relative'>
					<Box position='absolute' left='0' top='5px' w='4px' h='4px' borderRadius='full' bg='color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)' />
					{`Toggle developer tools from the command bar (${renderPlainTextDefinition('omni-bar.launch.commands')}) or `}
					<Link
						href='#'
						color='accent.pink'
						fontWeight='600'
						onClick={event => {
							event.preventDefault();
							event.stopPropagation();
							ipcWindowService.toggleDeveloperTools();
						}}
					>
						{'open them here'}
					</Link>
				</Box>
			</Flex>
		</Box>
	</Flex>
);

export default GraphQlError;
