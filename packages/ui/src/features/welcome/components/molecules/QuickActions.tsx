import ksuid from '@beak/ksuid';
import { materialiseInMemoryProject } from '@beak/state/project';
import { Box, Flex, SimpleGrid } from '@chakra-ui/react';
import { FilePlus2, FolderOpen, GitBranch, Hash, ImportIcon, Network } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { useMenuActionDispatcher } from '../../../../hooks/use-application-menu-event-listener';
import { ipcProjectService } from '../../../../lib/ipc';
import { actions as endpointsUiActions } from '../../../endpoints/store';
import type { EndpointKind } from '../../../endpoints/types';
import { sidebarPreferenceSetSelected } from '../../../../store/preferences/actions';
import { useAppSelector } from '../../../../store/redux';
import { fsaSupported, pickAndPersistLocalFolder } from '../../lib/pick-local-folder';

import ActionCard from './ActionCard';

interface QuickActionsProps {
	embedded: boolean;
	cloneEnabled: boolean;
	onCloneRequested: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ embedded, cloneEnabled, onCloneRequested }) => {
	const dispatch = useDispatch();
	const dispatchMenu = useMenuActionDispatcher();
	const projectMode = useAppSelector(s => s.global.project.mode);
	const webFsaAvailable = !embedded && fsaSupported();
	const openExistingEnabled = embedded || webFsaAvailable;

	// Welcome → schema-source tile path: promote the empty workbench to an
	// in-memory scratch project, switch the sidebar to Schema sources, and
	// post a "open the dialog for this kind" intent for EndpointsPane to
	// pick up on mount. Same flow regardless of which of the three tiles
	// the user clicked — the kind picks the dialog variant.
	function startWithSource(kind: EndpointKind) {
		if (projectMode === 'none') {
			dispatch(
				materialiseInMemoryProject({
					id: ksuid.generate('project').toString(),
					name: 'Untitled',
				}),
			);
		}
		dispatch(sidebarPreferenceSetSelected('schemas'));
		dispatch(endpointsUiActions.requestSchemaSourceDialog(kind));
	}

	return (
		<Box>
			<Flex
				align='center'
				gap='1.5'
				mb='2.5'
				color='fg.subtle'
				fontSize='10px'
				fontWeight='700'
				letterSpacing='0.08em'
				textTransform='uppercase'
			>
				{'Start a project'}
			</Flex>
			<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap='2.5' alignItems='stretch'>
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
					body='Pick a spec — Beak creates a project and seeds every operation as a request.'
					onClick={() => startWithSource('openapi')}
				/>
				<ActionCard
					idx={4}
					icon={Hash}
					tone='indigo'
					title='Connect GraphQL'
					body='Point Beak at a GraphQL endpoint — it introspects and folders up the schema as requests.'
					onClick={() => startWithSource('graphql')}
				/>
				<ActionCard
					idx={5}
					icon={Network}
					tone='teal'
					title='Connect gRPC'
					body='Reflect (or upload a .proto) and Beak materialises every method as a request.'
					onClick={() => startWithSource('grpc')}
				/>
			</SimpleGrid>
		</Box>
	);
};

export default QuickActions;
