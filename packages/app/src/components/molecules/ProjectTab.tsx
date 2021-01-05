import { actions } from '@beak/app/store/project';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ProjectTabContextMenuWrapper from '../atoms/TabContextMenuWrapper';
import TabItem from '../atoms/TabItem';

interface ProjectTabProps {
	nodeId: string;
	selectedRequestId: string | undefined;
}

const ProjectTab: React.FunctionComponent<ProjectTabProps> = props => {
	const { nodeId, selectedRequestId } = props;
	const dispatch = useDispatch();
	const node = useSelector(s => s.global.project.tree[nodeId]);
	const [target, setTarget] = useState<HTMLElement>();

	if (!node)
		return null;

	return (
		<ProjectTabContextMenuWrapper nodeId={node.id} target={target}>
			<TabItem
				active={selectedRequestId === node.id}
				key={node.id}
				onClick={() => dispatch(actions.requestSelected(node.id))}
				ref={(i: HTMLDivElement) => setTarget(i)}
			>
				{node.name}
			</TabItem>
		</ProjectTabContextMenuWrapper>
	);
};

export default ProjectTab;

// const node = tree![id] as RequestNode;

// if (!node)
// 	return null;

// return (
	// <TabItem
	// 	active={selectedRequest === id}
	// 	onClick={() => dispatch(requestSelected(node.id))}
	// 	key={node.id}
	// >
	// 	{node.name}
	// </TabItem>
// );
