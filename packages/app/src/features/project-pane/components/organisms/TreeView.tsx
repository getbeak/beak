import { Tree } from '@beak/common/types/beak-project';
import React, { useRef } from 'react';
import styled from 'styled-components';

import ContextMenuWrapper from '../atoms/ContextMenuWrapper';
import FolderItem from '../molecules/FolderItem';
import RequestItem from '../molecules/RequestItem';

export interface TreeViewProps {
	collapsed: boolean;
	tree: Tree;
}

const TreeView: React.FunctionComponent<TreeViewProps> = ({ collapsed, tree }) => {
	const container = useRef<HTMLDivElement>(null);
	const items = Object.values(tree)
		.filter(t => t.parent === 'tree')
		.sort((a, b) => a.name.localeCompare(b.name));

	return (
		<Container
			collapsed={collapsed}
			tabIndex={-1}
			ref={container}
		>
			<ContextMenuWrapper mode={'root'} target={container.current!}>
				{items.filter(i => i.type === 'folder').map(n => (
					<FolderItem depth={0} key={n.filePath} id={n.filePath} />
				))}

				{items.filter(i => i.type === 'request').map(n => (
					<RequestItem
						depth={0}
						key={n.filePath}
						id={n.id}
						parentNode={null}
					/>
				))}
			</ContextMenuWrapper>
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
