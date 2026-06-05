import Button from '@beak/ui/components/atoms/Button';
import FormError from '@beak/ui/components/atoms/FormError';
import FormInput from '@beak/ui/components/atoms/FormInput';
import Input from '@beak/ui/components/atoms/Input';
import Label from '@beak/ui/components/atoms/Label';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/ui/lib/ipc';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { KeyRound, Lock } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import ResetEncryptionConfirm from './ResetEncryptionConfirm';

const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

interface FixProjectEncryptionProps {
	onClose: (resolved: boolean) => void;
}

const FixProjectEncryption: React.FC<FixProjectEncryptionProps> = ({ onClose }) => {
	const [key, setKey] = useState('');
	const [error, setError] = useState('');
	const [disable, setDisable] = useState(false);
	const [resetting, setResetting] = useState(false);

	async function submit() {
		if (key === '' || disable) return;

		if (!base64regex.test(key)) {
			setError('That key doesn’t quite look right. Check it again');
			return;
		}

		setDisable(true);

		try {
			await ipcEncryptionService.submitKey({ key });
			onClose(true);
		} catch {
			setError('Unknown error saving encryption key');
		} finally {
			setDisable(false);
		}
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
		<Dialog onClose={() => onClose(false)} tone='alert'>
			<Box w='480px'>
				<DialogHeader
					icon={<Lock size={14} strokeWidth={2.2} />}
					title='Project encryption key needed'
					description='Encrypted values in this project can’t be read until the key is provided.'
				/>
				<DialogBody>
					<Box as='p' fontSize='sm' color='fg.default' mb='3' lineHeight='1.55'>
						{'Beak projects come with built-in encryption for storing secrets like passwords and tokens. '}
						{'Ask a teammate for the project key, paste it below, and continue.'}
					</Box>

					<FormInput>
						<Label>
							<Flex align='center' gap='1'>
								<KeyRound size={11} />
								{'Encryption key'}
							</Flex>
						</Label>
						<Input
							type='text'
							aria-label='Encryption key'
							placeholder='d2h5IGJvdGhlciBkZWNvZGluZyB0aGlzPw=='
							value={key}
							onChange={e => {
								if (error) setError('');
								setKey(e.currentTarget.value);
							}}
							onKeyDown={e => {
								if (e.key === 'Enter') submit();
							}}
						/>
						{error && <FormError>{error}</FormError>}
					</FormInput>

					<Box mt='4' pt='3' borderTop='1px solid var(--beak-colors-border-subtle)'>
						<Box as='p' fontSize='xs' color='fg.muted' lineHeight='1.55'>
							{'Lost the key for good? You can '}
							<chakra.button
								type='button'
								onClick={() => setResetting(true)}
								color='accent.alert'
								fontWeight='600'
								css={{
									background: 'none',
									border: 'none',
									padding: 0,
									cursor: 'pointer',
									textDecoration: 'underline',
									textUnderlineOffset: '2px',
								}}
							>
								{'reset project encryption'}
							</chakra.button>
							{'. This is destructive — every previously-encrypted value becomes unreadable.'}
						</Box>
					</Box>
				</DialogBody>
				<DialogFooter>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)}>
						{'Cancel'}
					</Button>
					<Button size='sm' disabled={disable} onClick={submit}>
						{disable ? 'Saving…' : 'Continue'}
					</Button>
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

export default FixProjectEncryption;
