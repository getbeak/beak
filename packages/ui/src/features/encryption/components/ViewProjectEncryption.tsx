import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/ui/lib/ipc';
import { motion } from 'framer-motion';
import { Check, Copy, KeyRound } from 'lucide-react';
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
			<Box w='480px' p='5'>
				<Flex align='center' gap='2' mb='3' color='accent.pink'>
					<KeyRound size={16} strokeWidth={2.2} />
					<Box fontSize='md' fontWeight='600' color='fg.default'>
						{'Project encryption'}
					</Box>
				</Flex>
				<Box as='p' fontSize='sm' color='fg.muted' lineHeight='1.55' mb='2'>
					{"Share the key below with your team to unlock your project's secrets. "}
					{"Be careful — don't post it anywhere permanent or public."}
				</Box>
				<Flex
					align='center'
					gap='1.5'
					mb='4'
					px='2.5'
					py='1.5'
					borderRadius='md'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 30%, var(--beak-colors-border-subtle))'
					bg='color-mix(in srgb, var(--beak-colors-accent-warning) 8%, transparent)'
					color='accent.warning'
					fontSize='10px'
					fontWeight='700'
					letterSpacing='0.06em'
					textTransform='uppercase'
				>
					<KeyRound size={11} strokeWidth={2.2} />
					{'Treat this as a password'}
				</Flex>
				<Flex justify='flex-end' gap='2'>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)}>{'Close'}</Button>
					<Button size='sm' onClick={copy}>
						<motion.span
							key={copied ? 'copied' : 'idle'}
							initial={{ opacity: 0, y: -2 }}
							animate={{ opacity: 1, y: 0 }}
							style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
						>
							{copied ? <Check size={12} /> : <Copy size={12} />}
							{copied ? 'Copied!' : 'Copy encryption key'}
						</motion.span>
					</Button>
				</Flex>
			</Box>
		</Dialog>
	);
};

export default ViewProjectEncryption;
