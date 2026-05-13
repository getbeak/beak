import { Box, HStack } from '@chakra-ui/react';
import Input, { InputInvalidText } from '@beak/ui/components/atoms/Input';
import Label from '@beak/ui/components/atoms/Label';
import { ipcProjectService } from '@beak/ui/lib/ipc';
import React, { useEffect, useRef, useState } from 'react';
import validFilename from 'valid-filename';

import Button from '../../../../components/atoms/Button';
import type { WelcomeViewType } from '../../../../containers/Welcome';
import ViewIntroLine from '../atoms/ViewIntroLine';
import ViewTitle from '../atoms/ViewTitle';

export interface CreateViewProps {
	setView: (view: WelcomeViewType) => void;
}

const CreateView: React.FC<CreateViewProps> = ({ setView }) => {
	const [working, setWorking] = useState(false);
	const [name, setName] = useState('');
	const projNameInput = useRef<HTMLInputElement>(null);
	const [validProjectName, setValidProjectName] = useState(true);

	useEffect(() => {
		projNameInput.current?.focus();
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
		<Box position='relative' w='calc(100% - 60px)' h='calc(100% - 80px)'>
			<ViewTitle>{"Let's get going 🌶"}</ViewTitle>
			<ViewIntroLine>{'You should be good to go in just a sec...'}</ViewIntroLine>

			<Label>{'Give your project a name'}</Label>
			<Input
				disabled={working}
				ref={projNameInput}
				placeholder=''
				type='text'
				value={name}
				onChange={e => projectNameChange(e.target.value)}
			/>
			{!validProjectName && (
				<InputInvalidText>
					{"That project name isn't valid, it contains invalid characters or reserved words!"}
				</InputInvalidText>
			)}

			<HStack position='absolute' bottom='0' right='0' gap='3'>
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
				<Button colour='secondary' onClick={() => setView('main')}>
					{'Cancel'}
				</Button>
			</HStack>
		</Box>
	);
};

export default CreateView;
