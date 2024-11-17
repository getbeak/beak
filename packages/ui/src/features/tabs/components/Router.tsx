import React from 'react';
import { ReflexContainer } from 'react-reflex';
import { TabItem } from '@beak/common/types/beak-project';
import ReflexElement from '@beak/ui/components/atoms/ReflexElement';
import ReflexSplitter from '@beak/ui/components/atoms/ReflexSplitter';
import NewProjectIntro from '@beak/ui/components/molecules/NewProjectIntro';
import PendingSlash from '@beak/ui/components/molecules/PendingSplash';
import { useAppSelector } from '@beak/ui/store/redux';
import type { RequestNode } from '@getbeak/types/nodes';

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
			<React.Fragment>
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
			</React.Fragment>
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

		default: return <span>{'Unknown renderer'}</span>;
	}
};

export default Router;
