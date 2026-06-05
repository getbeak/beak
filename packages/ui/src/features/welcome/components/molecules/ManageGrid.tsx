import type { SidebarVariant } from '@beak/common/types/beak-hub';
import { actions as omniBarActions } from '@beak/ui/features/omni-bar/store';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex, SimpleGrid } from '@chakra-ui/react';
import { Layers, Network, Plug, Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { sidebarPreferenceSetCollapse, sidebarPreferenceSetSelected } from '../../../../store/preferences/actions';

import ActionCard from './ActionCard';

const ManageGrid: React.FC = () => {
	const dispatch = useDispatch();
	const workflowCount = useAppSelector(s => Object.keys(s.global.workflows.workflows).length);
	const variableSetCount = useAppSelector(s => Object.keys(s.global.variableSets.variableSets ?? {}).length);

	const showSidebar = React.useCallback(
		(variant: SidebarVariant) => {
			dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
			dispatch(sidebarPreferenceSetSelected(variant));
		},
		[dispatch],
	);

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
				{'Edit this project'}
			</Flex>
			<SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap='2.5' alignItems='stretch'>
				<ActionCard
					idx={0}
					icon={Layers}
					tone='teal'
					title='Variable sets'
					keybinding={variableSetCount > 0 ? String(variableSetCount) : undefined}
					body='Define values once per environment — URLs, tokens, IDs — and reference them with {{name}} across every request. Flip the active set and every request swaps.'
					onClick={() => showSidebar('variables')}
				/>
				<ActionCard
					idx={1}
					icon={Network}
					tone='indigo'
					title='Schema sources'
					body='Connect an OpenAPI spec, GraphQL endpoint or gRPC service. Beak materialises every operation as a request and re-syncs whenever the schema changes.'
					onClick={() => showSidebar('schemas')}
				/>
				<ActionCard
					idx={2}
					icon={WorkflowIcon}
					tone='pink'
					title='Workflows'
					keybinding={workflowCount > 0 ? String(workflowCount) : undefined}
					body='Chain requests into a flow — Start → Request → Condition → Loop → Notify. Forks, simulates and saves to disk just like a request. Cmd+Shift+O to jump in.'
					onClick={() => dispatch(omniBarActions.showOmniBar({ mode: 'workflows' }))}
				/>
				<ActionCard
					idx={3}
					icon={Plug}
					tone='blue'
					title='Extensions'
					body='Write JavaScript that runs inside Beak — sign requests, decrypt payloads, fetch live tokens — and surface the result as a {{variable}} anywhere.'
					onClick={() => showSidebar('extensions')}
				/>
			</SimpleGrid>
		</Box>
	);
};

export default ManageGrid;
