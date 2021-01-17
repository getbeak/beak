import ReflexSplitter from '@beak/app/components/atoms/ReflexSplitter';
import { TabItem } from '@beak/app/store/project/types';
import React from 'react';
import { ReflexContainer, ReflexElement } from 'react-reflex';

import RequestPane from '../../request-pane/components/RequestPane';
import ResponsePane from '../../response-pane/components/ResponsePane';
import VariableGroupEditor from '../../variable-groups/components/VariableGroupEditor';

interface RouterProps {
	selectedTab: TabItem | undefined;
}

const Router: React.FunctionComponent<RouterProps> = ({ selectedTab }) => {
	if (!selectedTab)
		return <span>{'TODO: No selected tab state!!'}</span>;

	if (selectedTab.type === 'request') {
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
