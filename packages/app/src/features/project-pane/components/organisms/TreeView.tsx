import { Tree } from '@beak/common/types/beak-project';
import React, { useRef } from 'react';
import styled from 'styled-components';

import FolderItem from '../molecules/FolderItem';
import RequestItem from '../molecules/RequestItem';

export interface TreeViewProps {
	collapsed: boolean;
	tree: Tree;
}

const TreeView: React.FunctionComponent<TreeViewProps> = ({ collapsed, tree }) => {
	const items = Object.values(tree).filter(t => !t.parent);
	const container = useRef<HTMLDivElement>(null);

	return (
		<Container
			collapsed={collapsed}
			tabIndex={-1}
			ref={container}
		>
			{items.map(n => {
				if (n.type === 'folder')
					return <FolderItem depth={0} key={n.filePath} id={n.filePath} />;

				return (
					<RequestItem
						depth={0}
						key={n.filePath}
						id={n.id}
						parentNode={null}
					/>
				);
			})}
		</Container>
	);
};

const Container = styled.div<{ collapsed: boolean }>`
	flex-grow: 2;
	overflow-y: auto;

	${p => p.collapsed ? 'flex: 0' : ''}

	&:focus {
		outline: none;
	}
`;

export default TreeView;
