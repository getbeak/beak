import type { SidebarVariant } from '@beak/common/types/beak-hub';
import { Box, Flex, SimpleGrid } from '@chakra-ui/react';
import { Boxes, Layers, Network, Plug, Workflow } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { sidebarPreferenceSetCollapse, sidebarPreferenceSetSelected } from '../../../../store/preferences/actions';

import ActionCard from './ActionCard';

const ManageGrid: React.FC = () => {
	const dispatch = useDispatch();

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
			<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap='2.5' alignItems='stretch'>
				<ActionCard
					idx={0}
					icon={Boxes}
					tone='pink'
					title='Requests'
					body='Browse the request tree, cookies and source control.'
					onClick={() => showSidebar('project')}
				/>
				<ActionCard
					idx={1}
					icon={Layers}
					tone='teal'
					title='Variable sets'
					body='Switch between environments instantly — staging, prod, local.'
					onClick={() => showSidebar('variables')}
				/>
				<ActionCard
					idx={2}
					icon={Network}
					tone='indigo'
					title='Schema sources'
					body='Browse and edit the requests synced from your OpenAPI, GraphQL, and gRPC schemas.'
					onClick={() => showSidebar('schemas')}
				/>
				<ActionCard
					idx={3}
					icon={Workflow}
					tone='green'
					title='Workflows'
					body='Chain requests with loops, conditions, and notifications. Lives alongside requests in the project tree.'
					onClick={() => showSidebar('project')}
				/>
				<ActionCard
					idx={4}
					icon={Plug}
					tone='blue'
					title='Extensions'
					body='Add custom variables and realtime values via JavaScript extensions.'
					onClick={() => showSidebar('extensions')}
				/>
			</SimpleGrid>
		</Box>
	);
};

export default ManageGrid;
