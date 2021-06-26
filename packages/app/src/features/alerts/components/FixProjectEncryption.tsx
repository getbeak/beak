import Button from '@beak/app/components/atoms/Button';
import FormError from '@beak/app/components/atoms/FormError';
import FormInput from '@beak/app/components/atoms/FormInput';
import Input from '@beak/app/components/atoms/Input';
import Label from '@beak/app/components/atoms/Label';
import Dialog from '@beak/app/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/app/lib/ipc';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

interface FixProjectEncryptionProps {
	onClose: () => void;
}

const FixProjectEncryption: React.FunctionComponent<FixProjectEncryptionProps> = props => {
	const [key, setKey] = useState('');
	const [error, setError] = useState('');
	const [disable, setDisable] = useState(false);
	const projectPath = useSelector(s => s.global.project.projectPath)!;

	function submit() {
		if (key === '')
			return;

		if (!base64regex.test(key)) {
			setError('That key doesn\'t quite look right. Check it again');

			return;
		}

		setDisable(true);

		ipcEncryptionService
			.submitKey({ key, projectFolder: projectPath })
			.catch(() => setError('Unknown error saving encryption key'))
			.then(() => props.onClose())
			.finally(() => setDisable(false));
	}

	return (
		<Dialog onClose={() => props.onClose()}>
			<Container>
				<Title>{'Project encryption'}</Title>
				<Description>
					{'Beak projects come with built-in encryption for storing secure values '}
					{'and secrets to be stored remotly. You currently don\'t have the project encryption '}
					{'key stored, so you won\'t be able to use any encrypted values.'}
				</Description>

				<Description>
					{'Once you get the encryption key for the project, enter it below and you\'ll be all good to go!'}
				</Description>

				<FormInput>
					<Label>{'Encryption key'}</Label>
					<Input
						type={'text'}
						placeholder={'d2h5IGJvdGhlciBkZWNvZGluZyB0aGlzPw=='}
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
