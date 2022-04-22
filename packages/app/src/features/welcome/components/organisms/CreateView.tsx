import React, { useEffect, useRef, useState } from 'react';
import Input, { InputInvalidText } from '@beak/app/components/atoms/Input';
import Label from '@beak/app/components/atoms/Label';
import { ipcProjectService } from '@beak/app/lib/ipc';
import styled from 'styled-components';
import validFilename from 'valid-filename';

import Button from '../../../../components/atoms/Button';
import { WelcomeViewType } from '../../../../containers/Welcome';
import ViewIntroLine from '../atoms/ViewIntroLine';
import ViewTitle from '../atoms/ViewTitle';

export interface CreateViewProps {
	setView: (view: WelcomeViewType) => void;
}

const CreateView: React.FunctionComponent<React.PropsWithChildren<CreateViewProps>> = ({ setView }) => {
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

			<Label>{'Let\'s give your project a cool name'}</Label>
			<Input
				ref={projNameInput}
				placeholder={'My billion dollar side project'}
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
					disabled={!name || !validProjectName}
					onClick={() => {
						ipcProjectService.createProject({ projectName: name });
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
	width: calc(100vw - 60px);
	height: calc(100vh - 80px);
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
