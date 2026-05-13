import { Box } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import FormError from '@beak/ui/components/atoms/FormError';
import FormInput from '@beak/ui/components/atoms/FormInput';
import Input from '@beak/ui/components/atoms/Input';
import Label from '@beak/ui/components/atoms/Label';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/ui/lib/ipc';
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
		<Dialog onClose={() => onClose(false)}>
			<Box w='500px' p='4' fontSize='lg'>
				<Box fontSize='2xl' fontWeight='300'>{'Project encryption'}</Box>
				<Box as='p' fontSize='sm' color='fg.muted' my='1.5'>
					{'Beak projects come with built-in encryption for storing secrets, such as passwords or tokens. '}
					{"You currently don't have the project encryption key stored, so you won't be able to use any "}
					{'encrypted values.'}
				</Box>
				<Box as='p' fontSize='sm' color='fg.muted' my='1.5'>
					{"Ask for the project encryption key and then enter it below, then you'll be good to go!"}
				</Box>

				<FormInput>
					<Label>{'Encryption key'}</Label>
					<Input
						type='text'
						placeholder='example: d2h5IGJvdGhlciBkZWNvZGluZyB0aGlzPw=='
						value={key}
						onChange={e => setKey(e.currentTarget.value)}
						onKeyPress={e => {
							if (e.key === 'Enter') submit();
						}}
					/>
					{error && <FormError>{error}</FormError>}
				</FormInput>

				<Button disabled={disable} onClick={() => submit()}>
					{'Continue'}
				</Button>
			</Box>
		</Dialog>
	);
};

export default FixProjectEncryption;
