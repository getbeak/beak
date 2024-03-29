import React, { useEffect, useRef, useState } from 'react';
import Input, { InputInvalidText } from '@beak/ui/components/atoms/Input';
import Label from '@beak/ui/components/atoms/Label';
import { ipcProjectService } from '@beak/ui/lib/ipc';
import styled from 'styled-components';
import validFilename from 'valid-filename';

import Button from '../../../../components/atoms/Button';
import { WelcomeViewType } from '../../../../containers/Welcome';
import ViewIntroLine from '../atoms/ViewIntroLine';
import ViewTitle from '../atoms/ViewTitle';

export interface CreateViewProps {
	setView: (view: WelcomeViewType) => void;
}

const CreateView: React.FC<React.PropsWithChildren<CreateViewProps>> = ({ setView }) => {
	const [working, setWorking] = useState(false);
	const [name, setName] = useState('');
	const projNameInput = useRef<HTMLInputElement>(null);
	const [validProjectName, setValidProjectName] = useState(true);

	useEffect(() => {
		if (projNameInput.current)
			projNameInput.current.focus();
	}, []);

	function projectNameChange(name: string) {
		setName(name);

		if (!name.trim()) {
			setValidProjectName(true);

			return;
		}

		setValidProjectName(validFilename(name));
	}

	return (
		<Wrapper>
			<ViewTitle>{'Let\'s get going 🌶'}</ViewTitle>
			<ViewIntroLine>{'You should be good to go in just a sec...'}</ViewIntroLine>

			<Label>{'Give your project a name'}</Label>
			<Input
				disabled={working}
				ref={projNameInput}
				placeholder={''}
				type={'text'}
				value={name}
				onChange={e => projectNameChange(e.target.value)}
			/>
			{!validProjectName && (
				<InputInvalidText>
					{'That project name isn\'t valid, it contains invalid characters or reserved words!'}
				</InputInvalidText>
			)}

			<ActionsWrapper>
				<Button
					disabled={!name || !validProjectName || working}
					onClick={async () => {
						if (working) return;

						setWorking(true);

						try {
							// TODO(afr): Handle error
							await ipcProjectService.createProject({ projectName: name });
						} finally {
							setWorking(false);
						}
					}}
				>
					{'Select folder'}
				</Button>
				<ActionSpacer />
				<Button
					colour={'secondary'}
					onClick={() => setView('main')}
				>
					{'Cancel'}
				</Button>
			</ActionsWrapper>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: relative;
	top: 0; bottom: 0; left: 0; right: 0;
	width: calc(100% - 60px);
	height: calc(100% - 80px);
`;

const ActionsWrapper = styled.div`
	position: absolute;
	bottom: 0;
	right: 0;
`;

const ActionSpacer = styled.div`
	display: inline-block;
	width: 15px;
`;

export default CreateView;
