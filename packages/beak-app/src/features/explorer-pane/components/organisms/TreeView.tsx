import React from 'react';
import styled from 'styled-components';

import { Nodes } from '../../../../lib/project/types';
import FolderItem from '../molecules/FolderItem';
import RequestItem from '../molecules/RequestItem';

export interface TreeViewProps {
	tree: Nodes[];
}

const TreeView: React.FunctionComponent<TreeViewProps> = ({ tree }) => (
	<Container>
		{tree.map(n => {
			if (n.type === 'folder')
				return <FolderItem depth={0} key={n.filePath} node={n} />;

			return <RequestItem depth={0} key={n.filePath} node={n} />;
		})}
	</Container>
);

const Container = styled.div`
	flex-grow: 2;

	overflow-y: auto;
`;

export default TreeView;
