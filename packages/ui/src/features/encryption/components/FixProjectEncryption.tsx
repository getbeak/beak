import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import FormError from '@beak/ui/components/atoms/FormError';
import FormInput from '@beak/ui/components/atoms/FormInput';
import Input from '@beak/ui/components/atoms/Input';
import Label from '@beak/ui/components/atoms/Label';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/ui/lib/ipc';
import { KeyRound, Lock } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

interface FixProjectEncryptionProps {
	onClose: (resolved: boolean) => void;
}

const FixProjectEncryption: React.FC<FixProjectEncryptionProps> = ({ onClose }) => {
	const [key, setKey] = useState('');
	const [error, setError] = useState('');
	const [disable, setDisable] = useState(false);

	function submit() {
		if (key === '' || disable) return;

		if (!base64regex.test(key)) {
			setError("That key doesn't quite look right. Check it again");
			return;
		}

		setDisable(true);

		ipcEncryptionService
			.submitKey({ key })
			.catch(() => setError('Unknown error saving encryption key'))
			.then(() => onClose(true))
			.finally(() => setDisable(false));
	}

	return (
		<Dialog onClose={() => onClose(false)} tone='alert'>
			<Box w='480px' p='5'>
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
						<Lock size={14} strokeWidth={2} />
					</Flex>
					<Box fontSize='md' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
						{'Project encryption key needed'}
					</Box>
				</Flex>
				<Box as='p' fontSize='sm' color='fg.muted' mb='2' lineHeight='1.55'>
					{'Beak projects come with built-in encryption for storing secrets like passwords and tokens. '}
					{"You don't currently have the project encryption key stored, so encrypted values can't be read."}
				</Box>
				<Box as='p' fontSize='xs' color='fg.subtle' mb='4'>
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
						placeholder='d2h5IGJvdGhlciBkZWNvZGluZyB0aGlzPw=='
						value={key}
						onChange={e => {
							if (error) setError('');
							setKey(e.currentTarget.value);
						}}
						onKeyPress={e => {
							if (e.key === 'Enter') submit();
						}}
					/>
					{error && <FormError>{error}</FormError>}
				</FormInput>

				<Flex justify='flex-end' gap='2' mt='3'>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)}>{'Cancel'}</Button>
					<Button size='sm' disabled={disable} onClick={submit}>
						{disable ? 'Saving…' : 'Continue'}
					</Button>
				</Flex>
			</Box>
		</Dialog>
	);
};

export default FixProjectEncryption;
