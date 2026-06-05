import type Squawk from '@beak/common/utils/squawk';
import BeakButton from '@beak/ui/components/atoms/Button';
import EditorView from '@beak/ui/components/atoms/EditorView';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { Box, Button, Flex } from '@chakra-ui/react';
import { Puzzle } from 'lucide-react';
import * as React from 'react';

interface ViewExtensionErrorProps {
	error: Squawk;
	assumedName: string;
	filePath: string;
	onClose: () => void;
}

const ViewExtensionError: React.FC<ViewExtensionErrorProps> = props => (
	<Dialog onClose={props.onClose} tone='alert'>
		<Box w='560px'>
			<DialogHeader
				icon={<Puzzle size={14} strokeWidth={2.2} />}
				title='Unable to load extension'
				description='There was an issue while trying to load one of the installed extensions.'
			/>
			<DialogBody>
				<Flex
					direction='column'
					gap='1'
					p='2.5'
					borderRadius='md'
					borderWidth='1px'
					borderColor='border.subtle'
					bg='bg.canvas'
					fontSize='xs'
					mb='3'
				>
					<Flex justify='space-between' gap='2' align='center'>
						<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='fg.subtle'>
							{'Name'}
						</Box>
						<Box fontWeight='600' color='fg.default' fontFamily='mono' textAlign='right'>
							{props.assumedName}
						</Box>
					</Flex>
					<Flex justify='space-between' gap='2' align='center'>
						<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='fg.subtle'>
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
							_hover={{ textDecorationStyle: 'solid' }}
							onClick={() => ipcExplorerService.revealFile(props.filePath)}
						>
							{props.filePath}
						</Button>
					</Flex>
				</Flex>

				<Box fontSize='10px' fontWeight='700' color='fg.subtle' textTransform='uppercase' letterSpacing='0.06em' mb='1'>
					{'Error details'}
				</Box>
				<Box borderRadius='md' borderWidth='1px' borderColor='border.subtle' overflow='hidden' bg='bg.canvas'>
					<EditorView
						height='200px'
						language='json'
						value={JSON.stringify(props.error, null, '\t')}
						options={{ readOnly: true, lineNumbers: 'off' }}
					/>
				</Box>
			</DialogBody>
			<DialogFooter>
				<BeakButton size='sm' onClick={props.onClose}>
					{'Close'}
				</BeakButton>
			</DialogFooter>
		</Box>
	</Dialog>
);

export default ViewExtensionError;
