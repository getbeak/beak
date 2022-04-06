import React from 'react';
import { useSelector } from 'react-redux';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';
import Git from './organisms/Git';
import TreeView from './organisms/TreeView';
import VariableGroups from './organisms/VariableGroups';

const ProjectPane: React.FunctionComponent = () => {
	const project = useSelector(s => s.global.project);

	return (
		<SidebarPane>
			<SidebarPaneSection title={'Project'} collapseKey={'beak.project.project'}>
				<Git />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Variable groups'} collapseKey={'beak.project.variable-groups'}>
				<VariableGroups />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Explorer'} collapseKey={'beak.project.explorer'}>
				<TreeView tree={project.tree!} />
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default ProjectPane;
