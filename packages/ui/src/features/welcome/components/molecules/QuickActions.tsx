import { Box, Flex, SimpleGrid } from '@chakra-ui/react';
import { FilePlus2, FolderOpen, GitBranch, ImportIcon } from 'lucide-react';
import * as React from 'react';

import { useMenuActionDispatcher } from '../../../../hooks/use-application-menu-event-listener';
import { ipcProjectService } from '../../../../lib/ipc';
import { fsaSupported, pickAndPersistLocalFolder } from '../../lib/pick-local-folder';

import ActionCard from './ActionCard';

interface QuickActionsProps {
	embedded: boolean;
	cloneEnabled: boolean;
	onCloneRequested: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ embedded, cloneEnabled, onCloneRequested }) => {
	const dispatchMenu = useMenuActionDispatcher();
	const webFsaAvailable = !embedded && fsaSupported();
	const openExistingEnabled = embedded || webFsaAvailable;

	return (
		<Box>
			<Flex
				align='center'
				gap='1.5'
				mb='3.5'
				color='fg.subtle'
				fontSize='10px'
				fontWeight='700'
				letterSpacing='0.08em'
				textTransform='uppercase'
			>
				{'Get started'}
			</Flex>
			<SimpleGrid columns={{ base: 1, md: 2 }} gap='3'>
				<ActionCard
					idx={0}
					icon={FilePlus2}
					tone='pink'
					title='New request'
					body='Start with a blank request and craft it from scratch.'
					keybinding='⌘⇧N'
					onClick={() => dispatchMenu('new_request')}
				/>
				<ActionCard
					idx={1}
					icon={FolderOpen}
					tone='teal'
					title='Open existing'
					body={
						embedded
							? 'Open a Beak project folder from your computer.'
							: webFsaAvailable
								? 'Mount a local folder via the browser’s File System Access picker.'
								: 'Open a Beak project folder from your computer.'
					}
					keybinding={embedded ? '⌘O' : undefined}
					disabled={!openExistingEnabled}
					disabledReason='Your browser doesn’t expose the File System Access API. Use Chrome / Edge, or download the desktop app.'
					onClick={() => {
						if (embedded) {
							void ipcProjectService.openProject();
						} else {
							void pickAndPersistLocalFolder();
						}
					}}
				/>
				<ActionCard
					idx={2}
					icon={GitBranch}
					tone='indigo'
					title='Clone from Git'
					body='Pull down a Beak project from a Git remote and start working.'
					disabled={!cloneEnabled}
					disabledReason='Git integration is in flight — clone will land in the next update.'
					onClick={onCloneRequested}
				/>
				<ActionCard
					idx={3}
					icon={ImportIcon}
					tone='orange'
					title='Import OpenAPI'
					body='Generate a collection from an OpenAPI / Swagger spec.'
					onClick={() => dispatchMenu('import_openapi_spec')}
				/>
			</SimpleGrid>
		</Box>
	);
};

export default QuickActions;
