import Button from '@beak/ui/components/atoms/Button';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/ui/lib/ipc';
import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Copy, KeyRound } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import ResetEncryptionConfirm from './ResetEncryptionConfirm';

interface ViewProjectEncryptionProps {
	onClose: (resolved: boolean) => void;
}

const ViewProjectEncryption: React.FC<ViewProjectEncryptionProps> = ({ onClose }) => {
	const [copied, setCopied] = useState(false);
	const [resetting, setResetting] = useState(false);
	const copiedTimerRef = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
		},
		[],
	);

	function copy() {
		ipcEncryptionService.copyEncryptionKey();
		setCopied(true);
		if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
		copiedTimerRef.current = window.setTimeout(() => {
			setCopied(false);
			copiedTimerRef.current = null;
		}, 1500);
	}

	if (resetting) {
		return (
			<ResetEncryptionConfirm
				onClose={resolved => {
					setResetting(false);
					if (resolved) onClose(true);
				}}
			/>
		);
	}

	return (
		<Dialog onClose={() => onClose(false)}>
			<Box w='480px'>
				<DialogHeader icon={<KeyRound size={14} strokeWidth={2.2} />} title='Project encryption' />
				<DialogBody>
					<Box as='p' fontSize='sm' color='fg.default' lineHeight='1.55' mb='3'>
						{'Share the key below with your team to unlock your project’s secrets.'}
					</Box>
					<Flex
						align='center'
						gap='2'
						px='2.5'
						py='1.5'
						borderRadius='md'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 38%, var(--beak-colors-border-subtle))'
						bg='color-mix(in srgb, var(--beak-colors-accent-warning) 10%, var(--beak-colors-bg-surface))'
						color='fg.default'
						fontSize='xs'
					>
						<Box color='accent.warning' flex='0 0 auto'>
							<AlertTriangle size={13} strokeWidth={2.2} />
						</Box>
						<Box>
							<Box as='span' fontWeight='600'>
								{'Treat this as a password. '}
							</Box>
							<Box as='span' color='fg.muted'>
								{'Don’t post it anywhere permanent or public.'}
							</Box>
						</Box>
					</Flex>
				</DialogBody>
				<DialogFooter>
					<Flex flex='1' justify='flex-start'>
						<Button colour='secondary' size='sm' onClick={() => setResetting(true)}>
							{'Reset key…'}
						</Button>
					</Flex>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)}>
						{'Close'}
					</Button>
					<Button size='sm' onClick={copy}>
						<motion.span
							key={copied ? 'copied' : 'idle'}
							initial={{ opacity: 0, y: -2 }}
							animate={{ opacity: 1, y: 0 }}
							style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
						>
							{copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
							{copied ? 'Copied!' : 'Copy encryption key'}
						</motion.span>
					</Button>
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

export default ViewProjectEncryption;
