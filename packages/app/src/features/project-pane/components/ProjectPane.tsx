import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '@beak/app/store/project';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';
import { changeTab, makeTabPermanent } from '../../tabs/store/actions';
import TreeView from '../../tree-view/components/TreeView';
import Git from './organisms/Git';
import VariableGroups from './organisms/VariableGroups';

const ProjectPane: React.FunctionComponent = () => {
	const { tree, name } = useSelector(s => s.global.project);
	const selectedTabId = useSelector(s => s.features.tabs.selectedTab);
	const dispatch = useDispatch();

	return (
		<SidebarPane>
			<SidebarPaneSection title={`Project :: ${name!}`} collapseKey={'beak.project.project'}>
				<Git />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Variable groups'} collapseKey={'beak.project.variable-groups'}>
				<VariableGroups />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Explorer'} collapseKey={'beak.project.explorer'}>
				<TreeView
					activeNodeId={selectedTabId}
					tree={tree}
					onDrop={(sourceNodeId, destinationNodeId) => actions.moveNodeOnDisk({
						sourceNodeId,
						destinationNodeId,
					})}
					onNodeClick={(_event, node) => {
						if (node.type === 'folder')
							return;

						dispatch(changeTab({
							type: 'request',
							payload: node.id,
							temporary: true,
						}));
					}}
					onNodeDoubleClick={(_event, node) => {
						if (node.type === 'folder')
							return;

						dispatch(makeTabPermanent(node.id));
					}}
				/>
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default ProjectPane;
