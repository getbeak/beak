import React from 'react';
import { Col } from 'react-grid-system';

import createProject from '../../../../lib/project/create';
import ColumnTitle from '../atoms/ColumnTitle';
import GetStartedButton from '../molecules/GetStartedButton';

const electron = window.require('electron');

const GetStartedColumn: React.FunctionComponent = () => (
	<Col>
		<ColumnTitle>{'Get started'}</ColumnTitle>

		<GetStartedButton
			title={'Create a new project'}
			description={'Creates a new local project'}

			onClick={async () => {
				const opts = {
					name: 'Beak Test',
					projectPath: '/Users/afr/Downloads/beak-test',
				};

				await createProject(opts);
			}}
		/>

		<GetStartedButton
			title={'Open an existing project'}
			description={'Opens an existing local project'}

			onClick={async () => {
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

				ipcRenderer.send('project-open', filePath);
				remote.getCurrentWindow().close();
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
