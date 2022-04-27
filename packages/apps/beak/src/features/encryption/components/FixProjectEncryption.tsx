import React, { useState } from 'react';
import Button from '@beak/app-beak/components/atoms/Button';
import FormError from '@beak/app-beak/components/atoms/FormError';
import FormInput from '@beak/app-beak/components/atoms/FormInput';
import Input from '@beak/app-beak/components/atoms/Input';
import Label from '@beak/app-beak/components/atoms/Label';
import Dialog from '@beak/app-beak/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/app-beak/lib/ipc';
import styled from 'styled-components';

const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

interface FixProjectEncryptionProps {
	onClose: (resolved: boolean) => void;
}

const FixProjectEncryption: React.FC<React.PropsWithChildren<FixProjectEncryptionProps>> = props => {
	const [key, setKey] = useState('');
	const [error, setError] = useState('');
	const [disable, setDisable] = useState(false);

	function submit() {
		if (key === '' || disable)
			return;

		if (!base64regex.test(key)) {
			setError('That key doesn\'t quite look right. Check it again');

			return;
		}

		setDisable(true);

		ipcEncryptionService
			.submitKey({ key })
			.catch(() => setError('Unknown error saving encryption key'))
			.then(() => props.onClose(true))
			.finally(() => setDisable(false));
	}

	return (
		<Dialog onClose={() => props.onClose(false)}>
			<Container>
				<Title>{'Project encryption'}</Title>
				<Description>
					{'Beak projects come with built-in encryption for storing secrets, such as passwords or tokens. '}
					{'You currently don\'t have the project encryption key stored, so you won\'t be able to use any '}
					{'encrypted values.'}
				</Description>

				<Description>
					{'Ask for the project encryption key and then enter it below, then you\'ll be good to go!'}
				</Description>

				<FormInput>
					<Label>{'Encryption key'}</Label>
					<Input
						type={'text'}
						placeholder={'example: d2h5IGJvdGhlciBkZWNvZGluZyB0aGlzPw=='}
						value={key}
						onChange={e => setKey(e.currentTarget.value)}
						onKeyPress={e => {
							if (e.key === 'Enter')
								submit();
						}}
					/>
					{error && <FormError>{error}</FormError>}
				</FormInput>

				<Button
					disabled={disable}
					onClick={() => submit()}
				>
					{'Continue'}
				</Button>
			</Container>
		</Dialog>
	);
};

const Container = styled.div`
	width: 500px;

	padding: 15px;
	font-size: 14px;
`;

const Title = styled.div`
	font-size: 24px;
	font-weight: 300;
`;
const Description = styled.p`
	font-size: 12px;
	margin: 5px 0;
	color: ${p => p.theme.ui.textMinor};
`;

export default FixProjectEncryption;
