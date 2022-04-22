import React from 'react';
import Button from '@beak/app/components/atoms/Button';
import Dialog from '@beak/app/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/app/lib/ipc';
import styled from 'styled-components';

interface ViewProjectEncryptionProps {
	onClose: (resolved: boolean) => void;
}

const ViewProjectEncryption: React.FC<React.PropsWithChildren<ViewProjectEncryptionProps>> = props => (
	<Dialog onClose={() => props.onClose(false)}>
		<Container>
			<Title>{'Project encryption'}</Title>
			<Description>
				{'You can share the key below with your team to reveal your secrets... Be careful with this key, '}
				{'don\'t post it anywhere permanent or public!'}
			</Description>

			<Description>
				{'Tap the button below to add the encryption key to your clipboard'}
			</Description>

			<Button onClick={() => ipcEncryptionService.copyEncryptionKey()}>
				{'Copy encryption key'}
			</Button>
		</Container>
	</Dialog>
);

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
	/* margin: 5px 0; */
	color: ${p => p.theme.ui.textMinor};
`;

export default ViewProjectEncryption;
