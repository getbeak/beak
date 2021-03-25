import ReflexSplitter from '@beak/app/components/atoms/ReflexSplitter';
import { TabItem } from '@beak/app/store/project/types';
import React from 'react';
import { useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';

import RequestPane from '../../request-pane/components/RequestPane';
import ResponsePane from '../../response-pane/components/ResponsePane';
import VariableGroupEditor from '../../variable-groups/components/VariableGroupEditor';
import NotTheTabYourLookingFor from './molecules/NotTheTabYourLookingFor';

interface RouterProps {
	selectedTab: TabItem | undefined;
}

const Router: React.FunctionComponent<RouterProps> = ({ selectedTab }) => {
	const selectedRequest = useSelector(s => s.global.project.tree[selectedTab?.payload || '']);

	if (!selectedTab)
		return <NotTheTabYourLookingFor />;

	if (selectedTab.type === 'request') {
		if (!selectedRequest)
			return <NotTheTabYourLookingFor />;

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
