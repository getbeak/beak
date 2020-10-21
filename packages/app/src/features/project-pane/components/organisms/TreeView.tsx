import { Tree } from '@beak/common/beak-project/types';
import React from 'react';
import styled from 'styled-components';

import FolderItem from '../molecules/FolderItem';
import RequestItem from '../molecules/RequestItem';

export interface TreeViewProps {
	tree: Tree;
}

const TreeView: React.FunctionComponent<TreeViewProps> = ({ tree }) => {
	const items = Object.values(tree).filter(t => !t.parent);

	return (
		<Container>
			{items.map(n => {
				if (n.type === 'folder')
					return <FolderItem depth={0} key={n.filePath} id={n.filePath} />;

				return <RequestItem depth={0} key={n.filePath} id={n.id} />;
			})}
		</Container>
	);
};

const Container = styled.div`
	flex-grow: 2;

	overflow-y: auto;
`;

export default TreeView;
