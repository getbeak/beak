import { ipcProjectService } from '@beak/app/lib/ipc';
import React from 'react';
import { Col } from 'react-grid-system';

import { WelcomeViewType } from '../../../../containers/Welcome';
import ColumnTitle from '../atoms/ColumnTitle';
import GetStartedButton from '../molecules/GetStartedButton';

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

			onClick={() => {
				ipcProjectService.openProject();
			}}
		/>

		{/* <GetStartedButton
			disabled
			title={'Create a team project'}
			description={'Creates a new cloud-based team project'}
		/> */}
	</Col>
);

export default GetStartedColumn;
