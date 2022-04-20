import React from 'react';
import { useSelector } from 'react-redux';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';
import TreeView from '../../tree-view/components/TreeView';
import Git from './organisms/Git';
import VariableGroups from './organisms/VariableGroups';

const ProjectPane: React.FunctionComponent = () => {
	const { tree, name } = useSelector(s => s.global.project);

	return (
		<SidebarPane>
			<SidebarPaneSection title={`Project :: ${name!}`} collapseKey={'beak.project.project'}>
				<Git />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Variable groups'} collapseKey={'beak.project.variable-groups'}>
				<VariableGroups />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Explorer'} collapseKey={'beak.project.explorer'}>
				<TreeView items={tree} />
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default ProjectPane;
