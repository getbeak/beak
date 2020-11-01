import { Tree } from '@beak/common/types/beak-project';
import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { createExplorerMenu } from '../../context-menu';
import FolderItem from '../molecules/FolderItem';
import RequestItem from '../molecules/RequestItem';

export interface TreeViewProps {
	collapsed: boolean;
	tree: Tree;
}

const TreeView: React.FunctionComponent<TreeViewProps> = ({ collapsed, tree }) => {
	const items = Object.values(tree).filter(t => !t.parent);
	const container = useRef<HTMLDivElement>(null);
	const dispatch = useDispatch();

	useEffect(() => {
		if (!container.current)
			return;

		container.current.addEventListener('contextmenu', event => {
			const id = (function getId() {
				const elem = (event.target as HTMLDivElement);

				if (elem.dataset.treeId)
					return elem.dataset.treeId;

				return elem.parentElement!.dataset.treeId;
			}());

			createExplorerMenu(dispatch, id)?.popup();
		});
	}, [container.current]);

	return (
		<Container
			collapsed={collapsed}
			data-tree-id={'root'}
			ref={container}
		>
			{items.map(n => {
				if (n.type === 'folder')
					return <FolderItem depth={0} key={n.filePath} id={n.filePath} />;

				return <RequestItem depth={0} key={n.filePath} id={n.id} />;
			})}
		</Container>
	);
};

const Container = styled.div<{ collapsed: boolean }>`
	flex-grow: 2;

	overflow-y: auto;

	${p => p.collapsed ? 'flex: 0' : ''}
`;

export default TreeView;
