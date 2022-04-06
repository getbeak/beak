import React from 'react';
import { useSelector } from 'react-redux';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';

const VariablesPane: React.FunctionComponent = () => {
	useSelector(s => s.global.project);

	return (
		<SidebarPane>
			<SidebarPaneSection title={'Variable groups'} collapseKey={'beak.variables.variable-groups'}>
				<p>{'test'}</p>
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default VariablesPane;
