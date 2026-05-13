import { Box, Button } from '@chakra-ui/react';
import type Squawk from '@beak/common/utils/squawk';
import EditorView from '@beak/ui/components/atoms/EditorView';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import * as React from 'react';

interface ViewExtensionErrorProps {
	error: Squawk;
	assumedName: string;
	filePath: string;
	onClose: () => void;
}

const ViewExtensionError: React.FC<ViewExtensionErrorProps> = props => (
	<Dialog onClose={props.onClose}>
		<Box w='500px' p='4' fontSize='lg'>
			<Box fontSize='2xl' fontWeight='300'>{'Unable to load extension'}</Box>
			<Box as='p' fontSize='sm' color='fg.muted'>
				{'There was an issue while trying to load one of the installed extensions.'}
			</Box>

			<Box as='ul' fontSize='sm' color='fg.muted'>
				<li>
					{'Assumed extension name: '}
					<b>{props.assumedName}</b>
				</li>
				<li>
					{'Extension file path: '}
					<Button
						variant='plain'
						display='contents'
						fontWeight='medium'
						fontSize='sm'
						p='0'
						color='accent.pink'
						borderBottomWidth='1px'
						borderBottomStyle='dashed'
						borderBottomColor='accent.pink'
						onClick={() => ipcExplorerService.revealFile(props.filePath)}
					>
						{props.filePath}
					</Button>
				</li>
			</Box>

			<EditorView
				height='200px'
				language='json'
				value={JSON.stringify(props.error, null, '\t')}
				options={{ readOnly: true, lineNumbers: 'off' }}
			/>
		</Box>
	</Dialog>
);

export default ViewExtensionError;
