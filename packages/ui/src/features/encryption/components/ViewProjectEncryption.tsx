import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/ui/lib/ipc';
import { motion } from 'framer-motion';
import { Copy, KeyRound } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

interface ViewProjectEncryptionProps {
	onClose: (resolved: boolean) => void;
}

const ViewProjectEncryption: React.FC<ViewProjectEncryptionProps> = ({ onClose }) => {
	const [copied, setCopied] = useState(false);

	function copy() {
		ipcEncryptionService.copyEncryptionKey();
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	}

	return (
		<Dialog onClose={() => onClose(false)}>
			<Box w='480px' p='4'>
				<Flex align='center' gap='2' mb='2' color='accent.pink'>
					<KeyRound size={16} />
					<Box fontSize='md' fontWeight='600' color='fg.default'>
						{'Project encryption'}
					</Box>
				</Flex>
				<Box as='p' fontSize='sm' color='fg.muted' mb='2'>
					{"Share the key below with your team to unlock your project's secrets. Be careful — "}
					{"don't post it anywhere permanent or public."}
				</Box>
				<Box as='p' fontSize='xs' color='fg.subtle' mb='4'>
					{'Tap the button to copy the key to your clipboard.'}
				</Box>
				<Flex justify='flex-end' gap='2'>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)}>{'Close'}</Button>
					<Button size='sm' onClick={copy}>
						<motion.span
							key={copied ? 'copied' : 'idle'}
							initial={{ opacity: 0, y: -2 }}
							animate={{ opacity: 1, y: 0 }}
							style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
						>
							<Copy size={12} />
							{copied ? 'Copied!' : 'Copy encryption key'}
						</motion.span>
					</Button>
				</Flex>
			</Box>
		</Dialog>
	);
};

export default ViewProjectEncryption;
