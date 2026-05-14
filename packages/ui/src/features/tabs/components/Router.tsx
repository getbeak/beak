import { Box, Flex } from '@chakra-ui/react';
import React from 'react';
import { ReflexContainer } from 'react-reflex';
import type { TabItem } from '@beak/common/types/beak-project';
import ReflexElement from '@beak/ui/components/atoms/ReflexElement';
import ReflexSplitter from '@beak/ui/components/atoms/ReflexSplitter';
import NewProjectIntro from '@beak/ui/components/molecules/NewProjectIntro';
import PendingSlash from '@beak/ui/components/molecules/PendingSplash';
import { useAppSelector } from '@beak/ui/store/redux';
import type { RequestNode } from '@getbeak/types/nodes';
import { HelpCircle } from 'lucide-react';

import Preferences from '../../../containers/Preferences';
import BrokenRequest from '../../broken-request/components/BrokenRequest';
import RequestPane from '../../request-pane/components/RequestPane';
import ResponsePane from '../../response-pane/components/ResponsePane';
import VariableSetEditor from '../../variable-sets/components/VariableSetEditor';

interface RouterProps {
	selectedTab: TabItem | undefined;
}

const Router: React.FC<React.PropsWithChildren<RouterProps>> = ({ selectedTab }) => {
	const selectedItem = useAppSelector(s => s.global.project.tree[selectedTab?.payload || '']);

	if (!selectedTab)
		return <PendingSlash />;

	if (selectedTab.type === 'request') {
		const selectedRequest = selectedItem as RequestNode;

		if (!selectedRequest)
			return <PendingSlash />;

		if (selectedRequest.mode === 'failed') {
			return (
				<BrokenRequest
					filePath={selectedRequest.filePath}
					error={selectedRequest.error}
				/>
			);
		}

		return (
			<ReflexContainer orientation={'vertical'}>
				<ReflexElement
					flex={50}
					minSize={450}
				>
					<RequestPane />
				</ReflexElement>

				<ReflexSplitter orientation={'vertical'} />

				<ReflexElement
					flex={50}
					minSize={450}
				>
					<ResponsePane />
				</ReflexElement>
			</ReflexContainer>
		);
	}

	switch (selectedTab.type) {
		case 'variable_set_editor': {
			const variableSetName = selectedTab.payload;

			return (
				<VariableSetEditor
					key={variableSetName}
					variableSetName={variableSetName}
				/>
			);
		}

		case 'new_project_intro':
			return <NewProjectIntro />;

		case 'preferences':
			return <Preferences />;

		default: return (
			<Flex h='100%' align='center' justify='center' direction='column' gap='2' bg='bg.canvas' textAlign='center' px='6'>
				<Flex
					align='center'
					justify='center'
					w='44px'
					h='44px'
					borderRadius='full'
					bg='color-mix(in srgb, var(--beak-colors-fg-subtle) 10%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-fg-subtle) 22%, transparent)'
					color='fg.subtle'
					boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-fg-subtle) 14%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
				>
					<HelpCircle size={20} strokeWidth={1.8} />
				</Flex>
				<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
					{'Unknown tab type'}
				</Box>
				<Box fontSize='10px' color='accent.pink' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
					{'Renderer not registered'}
				</Box>
			</Flex>
		);
	}
};

export default Router;
