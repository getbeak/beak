import { ipcProjectService } from '@beak/app/lib/ipc';
import { faEgg, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import styled from 'styled-components';

import { WelcomeViewType } from '../../../../containers/Welcome';
import ColumnTitle from '../atoms/ColumnTitle';
import GetStartedButton from '../molecules/GetStartedButton';

export interface GetStartedColumnProps {
	setView: (view: WelcomeViewType) => void;
}

const GetStartedColumn: React.FunctionComponent<GetStartedColumnProps> = ({ setView }) => (
	<Wrapper>
		<ColumnTitle>{'Get started'}</ColumnTitle>

		<GetStartedButton
			title={'Create a new project'}
			description={'Creates a new local project'}
			icon={faEgg}
			onClick={() => setView('create-local')}
		/>

		<GetStartedButton
			title={'Open an existing project'}
			description={'Opens an existing local project'}
			icon={faFolderOpen}
			onClick={() => ipcProjectService.openProject()}
		/>

	</Wrapper>
);

const Wrapper = styled.div``;

export default GetStartedColumn;
