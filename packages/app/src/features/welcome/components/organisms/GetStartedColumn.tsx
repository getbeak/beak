import React from 'react';
import { ipcExplorerService, ipcProjectService } from '@beak/app/lib/ipc';
import { faBook, faEgg, faEnvelopeOpen, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

import { WelcomeViewType } from '../../../../containers/Welcome';
import ColumnTitle from '../atoms/ColumnTitle';
import GetStartedButton from '../molecules/GetStartedButton';

export interface GetStartedColumnProps {
	setView: (view: WelcomeViewType) => void;
}

const GetStartedColumn: React.FC<React.PropsWithChildren<GetStartedColumnProps>> = ({ setView }) => (
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

		<ColumnTitle>{'Useful things'}</ColumnTitle>
		<GetStartedButton
			title={'View manual'}
			description={'Get sweet & spicy tips for Beak'}
			icon={faBook}
			iconColor={'primaryFill'}
			onClick={() => ipcExplorerService.launchUrl('https://docs.getbeak.app')}
		/>
		<GetStartedButton
			title={'Get support'}
			description={'Reach out if you need help'}
			icon={faEnvelopeOpen}
			iconColor={'primaryFill'}
			onClick={() => ipcExplorerService.launchUrl('mailto:support@getbeak.app')}
		/>
	</Wrapper>
);

const Wrapper = styled.div`
	flex-basis: 40%;
`;

export default GetStartedColumn;
