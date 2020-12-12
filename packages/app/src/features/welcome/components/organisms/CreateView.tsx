import { sync } from 'command-exists';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import validFilename from 'valid-filename';

import Button from '../../../../components/atoms/Button';
import { WelcomeViewType } from '../../../../containers/Welcome';
import ViewIntroLine from '../atoms/ViewIntroLine';
import ViewTitle from '../atoms/ViewTitle';

const electron = window.require('electron');
const { ipcRenderer } = electron;

export interface CreateViewProps {
	setView: (view: WelcomeViewType) => void;
}

const CreateView: React.FunctionComponent<CreateViewProps> = ({ setView }) => {
	const [detectedGit, setDetectedGit] = useState<boolean | undefined>(() => detectGit());
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

			{!detectedGit && (
				<Alert>
					<strong>{'Git was not detected!'}</strong><br />
					<span>
						{'It seems Beak couldn\'t detect an installation of Git. Git is '}
						{'required to create Beak projects. Please install Git and '}
						{'click re check.'}
					</span>
					<RecheckButtonContainer>
						<Button onClick={() => setDetectedGit(detectGit())}>{'Re-check'}</Button>
					</RecheckButtonContainer>
				</Alert>
			)}

			<Label>{'Let\'s give your project a cool name'}</Label>
			<Input
				ref={projNameInput}
				placeholder={'My billion dollar side project'}
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
					disabled={!name || !detectedGit || !validProjectName}
					onClick={() => {
						ipcRenderer.send('project:create', name);
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

function detectGit() {
	return sync('git');
}

const Wrapper = styled.div`
	position: relative;
	top: 0; bottom: 0; left: 0; right: 0;
	width: calc(100vw - 60px);
	height: calc(100vh - 80px);
`;

const Alert = styled.div`
	border-radius: 4px;
	border: 2px solid ${p => p.theme.ui.destructiveAction}AA;
	background: ${p => p.theme.ui.destructiveAction}33;

	padding: 10px 10px;
	margin-bottom: 15px;
`;

const RecheckButtonContainer = styled.div`
	display: flex;
	margin-top: 10px;
	width: 100%;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 5px;
`;

const Input = styled.input`
	background-color: ${p => p.theme.ui.surface};
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	border: 1px solid ${p => p.theme.ui.primaryFill};
	border-radius: 4px;
	padding: 3px 5px;
	width: 100%;
	font-size: 15px;

	&:focus {
		outline: 0;
		border-color: ${p => p.theme.ui.primaryFill};
		box-shadow: 0 0 0 3px ${p => p.theme.ui.primaryFill}AA;
	}
`;

const InputInvalidText = styled.span`
	display: block;
	padding: 1px 0;
	font-size: 13px;
	font-weight: bold;
	color: ${p => p.theme.ui.destructiveAction};
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
