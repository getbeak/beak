import { Box } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/ui/lib/ipc';
import * as React from 'react';

interface ViewProjectEncryptionProps {
	onClose: (resolved: boolean) => void;
}

const ViewProjectEncryption: React.FC<ViewProjectEncryptionProps> = ({ onClose }) => (
	<Dialog onClose={() => onClose(false)}>
		<Box w='500px' p='4' fontSize='lg'>
			<Box fontSize='2xl' fontWeight='300'>{'Project encryption'}</Box>
			<Box as='p' fontSize='sm' color='fg.muted'>
				{'You can share the key below with your team to reveal your secrets... Be careful with this key, '}
				{"don't post it anywhere permanent or public!"}
			</Box>
			<Box as='p' fontSize='sm' color='fg.muted'>
				{'Tap the button below to add the encryption key to your clipboard'}
			</Box>
			<Button onClick={() => ipcEncryptionService.copyEncryptionKey()}>{'Copy encryption key'}</Button>
		</Box>
	</Dialog>
);

export default ViewProjectEncryption;
