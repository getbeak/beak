import React from 'react';
import { Col } from 'react-grid-system';

import { WelcomeViewType } from '../../../../containers/Welcome';
import { getGlobal } from '../../../../globals';
import ColumnTitle from '../atoms/ColumnTitle';
import GetStartedButton from '../molecules/GetStartedButton';

const electron = window.require('electron');

export interface GetStartedColumnProps {
	setView: (view: WelcomeViewType) => void;
}

const GetStartedColumn: React.FunctionComponent<GetStartedColumnProps> = ({ setView }) => (
	<Col>
		<ColumnTitle>{'Get started'}</ColumnTitle>

		<GetStartedButton
			title={'Create a new project'}
			description={'Creates a new local project'}
			onClick={() => setView('create-local')}
		/>

		<GetStartedButton
			title={'Open an existing project'}
			description={'Opens an existing local project'}

			onClick={async () => {
				// TODO(afr): Remove this remote and switch to using ipc
				const { remote, ipcRenderer } = electron;
				const { dialog } = remote;

				const result = await dialog.showOpenDialog({
					title: 'Open a beak project',
					buttonLabel: 'Open',
					properties: ['openFile'],
					filters: [
						{ name: 'Beak project', extensions: ['json'] },
						{ name: 'All files', extensions: ['*'] },
					],
				});

				if (!result || result.canceled || result.filePaths.length !== 1)
					return;

				const [filePath] = result.filePaths;

				ipcRenderer.invoke('project-open', filePath);
				ipcRenderer.invoke('close-window', getGlobal('windowId'));
			}}
		/>

		<GetStartedButton
			disabled
			title={'Create a team project'}
			description={'Creates a new cloud-based team project'}
		/>
	</Col>
);

export default GetStartedColumn;
