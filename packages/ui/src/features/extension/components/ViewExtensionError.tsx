import { Box, Button, Flex } from '@chakra-ui/react';
import type Squawk from '@beak/common/utils/squawk';
import EditorView from '@beak/ui/components/atoms/EditorView';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { Puzzle } from 'lucide-react';
import * as React from 'react';

interface ViewExtensionErrorProps {
	error: Squawk;
	assumedName: string;
	filePath: string;
	onClose: () => void;
}

const ViewExtensionError: React.FC<ViewExtensionErrorProps> = props => (
	<Dialog onClose={props.onClose}>
		<Box w='520px' p='4'>
			<Flex align='center' gap='2.5' mb='3'>
				<Flex
					align='center'
					justify='center'
					w='32px'
					h='32px'
					borderRadius='full'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, transparent)'
					color='accent.alert'
					boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-alert) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 16%, transparent)'
				>
					<Puzzle size={14} strokeWidth={2} />
				</Flex>
				<Box fontSize='md' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
					{'Unable to load extension'}
				</Box>
			</Flex>
			<Box as='p' fontSize='sm' color='fg.muted' mb='3'>
				{'There was an issue while trying to load one of the installed extensions.'}
			</Box>

			<Flex
				direction='column'
				gap='1'
				p='2.5'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
				fontSize='xs'
				mb='3'
			>
				<Flex justify='space-between' gap='2'>
					<Box
						fontSize='10px'
						fontWeight='700'
						letterSpacing='0.06em'
						textTransform='uppercase'
						color='fg.subtle'
					>
						{'Name'}
					</Box>
					<Box fontWeight='600' color='fg.default' fontFamily='mono' textAlign='right'>
						{props.assumedName}
					</Box>
				</Flex>
				<Flex justify='space-between' gap='2'>
					<Box
						fontSize='10px'
						fontWeight='700'
						letterSpacing='0.06em'
						textTransform='uppercase'
						color='fg.subtle'
					>
						{'Path'}
					</Box>
					<Button
						variant='plain'
						p='0'
						h='auto'
						minH='unset'
						fontWeight='500'
						fontSize='xs'
						fontFamily='mono'
						color='accent.pink'
						textDecoration='underline'
						textDecorationStyle='dotted'
						onClick={() => ipcExplorerService.revealFile(props.filePath)}
					>
						{props.filePath}
					</Button>
				</Flex>
			</Flex>

			<Box fontSize='10px' fontWeight='700' color='accent.alert' textTransform='uppercase' letterSpacing='0.06em' mb='1'>
				{'Error details'}
			</Box>
			<Box borderRadius='md' borderWidth='1px' borderColor='border.subtle' overflow='hidden'>
				<EditorView
					height='200px'
					language='json'
					value={JSON.stringify(props.error, null, '\t')}
					options={{ readOnly: true, lineNumbers: 'off' }}
				/>
			</Box>
		</Box>
	</Dialog>
);

export default ViewExtensionError;
