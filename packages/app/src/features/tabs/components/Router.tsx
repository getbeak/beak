import React from 'react';
import { useSelector } from 'react-redux';
import { ReflexContainer } from 'react-reflex';
import ReflexElement from '@beak/app/components/atoms/ReflexElement';
import ReflexSplitter from '@beak/app/components/atoms/ReflexSplitter';
import PendingSlash from '@beak/app/components/molecules/PendingSplash';
import { RequestNode, TabItem } from '@beak/common/types/beak-project';

import BrokenRequest from '../../broken-request/components/BrokenRequest';
import RequestPane from '../../request-pane/components/RequestPane';
import ResponsePane from '../../response-pane/components/ResponsePane';
import VariableGroupEditor from '../../variable-groups/components/VariableGroupEditor';

interface RouterProps {
	selectedTab: TabItem | undefined;
}

const Router: React.FunctionComponent<React.PropsWithChildren<RouterProps>> = ({ selectedTab }) => {
	const selectedItem = useSelector(s => s.global.project.tree[selectedTab?.payload || '']);

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
		case 'variable_group_editor': {
			const variableGroupName = selectedTab.payload;

			return (
				<VariableGroupEditor
					key={variableGroupName}
					variableGroupName={variableGroupName}
				/>
			);
		}

		default: return <span>{'Unknown renderer'}</span>;
	}
};

export default Router;
