import ReflexSplitter from '@beak/app/components/atoms/ReflexSplitter';
import { RequestNode, TabItem } from '@beak/common/types/beak-project';
import React from 'react';
import { useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';

import BrokenRequest from '../../broken-request/components/BrokenRequest';
import RequestPane from '../../request-pane/components/RequestPane';
import ResponsePane from '../../response-pane/components/ResponsePane';
import VariableGroupEditor from '../../variable-groups/components/VariableGroupEditor';
import NotTheTabYourLookingFor from './molecules/NotTheTabYourLookingFor';

interface RouterProps {
	selectedTab: TabItem | undefined;
}

const Router: React.FunctionComponent<RouterProps> = ({ selectedTab }) => {
	const selectedItem = useSelector(s => s.global.project.tree[selectedTab?.payload || '']);

	if (!selectedTab)
		return <NotTheTabYourLookingFor />;

	if (selectedTab.type === 'request') {
		const selectedRequest = selectedItem as RequestNode;

		if (!selectedRequest)
			return <NotTheTabYourLookingFor />;

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

	switch (selectedTab.payload) {
		case 'variable_group_editor':
			return <VariableGroupEditor />;

		default: return <span>{'Unknown renderer'}</span>;
	}
};

export default Router;
