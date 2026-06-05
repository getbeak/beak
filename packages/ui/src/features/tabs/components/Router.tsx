import type { TabItem } from '@beak/common/types/beak-project';
import ReflexElement from '@beak/ui/components/atoms/ReflexElement';
import ReflexSplitter from '@beak/ui/components/atoms/ReflexSplitter';
import ErrorBoundary from '@beak/ui/components/molecules/ErrorBoundary';
import NewProjectIntro from '@beak/ui/components/molecules/NewProjectIntro';
import PendingSlash from '@beak/ui/components/molecules/PendingSplash';
import { usePaneSplit } from '@beak/ui/hooks/use-pane-split';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import type { RequestNode } from '@getbeak/types/nodes';
import { HelpCircle } from 'lucide-react';
import React, { useEffect } from 'react';
import { ReflexContainer } from 'react-reflex';

import Preferences from '../../../containers/Preferences';
import ProjectHome from '../../../containers/ProjectHome';
import BrokenRequest from '../../broken-request/components/BrokenRequest';
import CookieJarEditor from '../../cookies/components/CookieJarEditor';
import FolderOverview from '../../folder-overview/components/FolderOverview';
import RequestPane from '../../request-pane/components/RequestPane';
import ResponsePane from '../../response-pane/components/ResponsePane';
import VariableInputPlayground from '../../variable-input/playground/VariableInputPlayground';
import VariableSetEditor from '../../variable-sets/components/VariableSetEditor';
import WorkflowEditor from '../../workflows/components/WorkflowEditor';
import { useTabPresentation } from '../contexts/tab-presentation';

interface RouterProps {
	selectedTab: TabItem | undefined;
}

const Router: React.FC<React.PropsWithChildren<RouterProps>> = ({ selectedTab }) => {
	const selectedItem = useAppSelector(s => s.global.project.tree[selectedTab?.payload || '']);
	const presentation = useTabPresentation();
	const currentRequest = selectedTab?.type === 'request' ? (selectedItem as RequestNode | undefined) : undefined;

	const reqResSplit = usePaneSplit({
		key: 'request-response',
		defaultRatio: 0.5,
		orientation: 'vertical',
		minRatio: 0.2,
		maxRatio: 0.8,
	});

	// A tab that lands in (or falls into) failed mode sticks to the raw
	// editor — successful saves shouldn't yank the user back to the request
	// view without an explicit confirmation.
	useEffect(() => {
		if (currentRequest?.mode === 'failed') presentation.markBrokenSticky(currentRequest.id);
	}, [currentRequest?.id, currentRequest?.mode, presentation]);

	if (!selectedTab) return <PendingSlash />;

	if (selectedTab.type === 'request') {
		const selectedRequest = selectedItem as RequestNode;

		if (!selectedRequest) return <PendingSlash />;

		const isSticky = presentation.isBrokenSticky(selectedRequest.id);
		const isRawEditing = presentation.isRawEditing(selectedRequest.id);
		const showRawEditor = selectedRequest.mode === 'failed' || isSticky || isRawEditing;

		if (showRawEditor) {
			return (
				<BrokenRequest
					filePath={selectedRequest.filePath}
					node={selectedRequest}
					// Sticky/failed paths only allow dismiss once the file is
					// valid (otherwise the request view would crash on a failed
					// node). User-toggled raw edits are always valid, so
					// leaving anytime is safe.
					allowDismissAnytime={!isSticky && selectedRequest.mode !== 'failed'}
					onDismiss={() => {
						presentation.clearBrokenSticky(selectedRequest.id);
						presentation.exitRawEdit(selectedRequest.id);
					}}
				/>
			);
		}

		return (
			<ReflexContainer orientation={'vertical'}>
				<ReflexElement flex={reqResSplit.firstFlex} minSize={450} onStopResize={reqResSplit.onStopResize}>
					<ErrorBoundary variant='panel' label='Request pane' resetKeys={[selectedRequest.id]}>
						<RequestPane />
					</ErrorBoundary>
				</ReflexElement>

				<ReflexSplitter orientation={'vertical'} />

				<ReflexElement flex={reqResSplit.secondFlex} minSize={450}>
					<ErrorBoundary variant='panel' label='Response pane' resetKeys={[selectedRequest.id]}>
						<ResponsePane />
					</ErrorBoundary>
				</ReflexElement>
			</ReflexContainer>
		);
	}

	switch (selectedTab.type) {
		case 'variable_set_editor': {
			const variableSetName = selectedTab.payload;

			return <VariableSetEditor key={variableSetName} variableSetName={variableSetName} />;
		}

		case 'new_project_intro':
			return <NewProjectIntro />;

		case 'preferences':
			return <Preferences />;

		case 'project_home':
			return <ProjectHome />;

		case 'folder_overview':
			return <FolderOverview key={selectedTab.payload} folderId={selectedTab.payload} />;

		case 'cookie_jar':
			return <CookieJarEditor />;

		case 'workflow_editor': {
			const workflowId = selectedTab.payload;
			return <WorkflowEditor key={workflowId} workflowId={workflowId} />;
		}

		case 'variable_input_playground':
			return <VariableInputPlayground />;

		default:
			return (
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
