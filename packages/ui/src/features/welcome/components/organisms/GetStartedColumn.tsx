import { ipcExplorerService, ipcProjectService } from '@beak/ui/lib/ipc';
import { Book, Egg, FolderOpen, MailOpen } from 'lucide-react';

import React from 'react';
import styled from 'styled-components';

import type { WelcomeViewType } from '../../../../containers/Welcome';
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
			icon={Egg}
			onClick={() => setView('create-local')}
		/>
		<GetStartedButton
			title={'Open an existing project'}
			description={'Opens an existing local project'}
			icon={FolderOpen}
			onClick={() => ipcProjectService.openProject()}
		/>

		<ColumnTitle>{'Useful things'}</ColumnTitle>
		<GetStartedButton
			title={'View manual'}
			description={'Get sweet & spicy tips for Beak'}
			icon={Book}
			iconColor={'primaryFill'}
			onClick={() => ipcExplorerService.launchUrl('https://docs.getbeak.app')}
		/>
		<GetStartedButton
			title={'Get support'}
			description={'Reach out if you need help'}
			icon={MailOpen}
			iconColor={'primaryFill'}
			onClick={() => ipcExplorerService.launchUrl('mailto:support@getbeak.app')}
		/>
	</Wrapper>
);

const Wrapper = styled.div`
	flex-basis: 40%;
`;

export default GetStartedColumn;
