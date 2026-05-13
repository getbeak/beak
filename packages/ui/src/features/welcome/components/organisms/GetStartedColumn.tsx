import { Box } from '@chakra-ui/react';
import { ipcExplorerService, ipcProjectService } from '@beak/ui/lib/ipc';
import { Book, Egg, FolderOpen, MailOpen } from 'lucide-react';
import * as React from 'react';

import type { WelcomeViewType } from '../../../../containers/Welcome';
import ColumnTitle from '../atoms/ColumnTitle';
import GetStartedButton from '../molecules/GetStartedButton';

export interface GetStartedColumnProps {
	setView: (view: WelcomeViewType) => void;
}

const GetStartedColumn: React.FC<GetStartedColumnProps> = ({ setView }) => (
	<Box flexBasis='40%'>
		<ColumnTitle>{'Get started'}</ColumnTitle>
		<GetStartedButton
			title='Create a new project'
			description='Creates a new local project'
			icon={Egg}
			onClick={() => setView('create-local')}
		/>
		<GetStartedButton
			title='Open an existing project'
			description='Opens an existing local project'
			icon={FolderOpen}
			onClick={() => ipcProjectService.openProject()}
		/>

		<ColumnTitle>{'Useful things'}</ColumnTitle>
		<GetStartedButton
			title='View manual'
			description='Get sweet & spicy tips for Beak'
			icon={Book}
			iconColor='primaryFill'
			onClick={() => ipcExplorerService.launchUrl('https://docs.getbeak.app')}
		/>
		<GetStartedButton
			title='Get support'
			description='Reach out if you need help'
			icon={MailOpen}
			iconColor='primaryFill'
			onClick={() => ipcExplorerService.launchUrl('mailto:support@getbeak.app')}
		/>
	</Box>
);

export default GetStartedColumn;
