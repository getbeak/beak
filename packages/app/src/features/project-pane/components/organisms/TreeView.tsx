import React, { useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend'
import useSectionBody from '@beak/app/features/sidebar/hooks/use-section-body';
import { Tree } from '@beak/common/types/beak-project';
import styled from 'styled-components';

import ContextMenuWrapper from '../atoms/ContextMenuWrapper';
import FolderItem from '../molecules/FolderItem';
import RequestItem from '../molecules/RequestItem';

export interface TreeViewProps {
	tree: Tree;
}

const TreeView: React.FunctionComponent<TreeViewProps> = ({ tree }) => {
	const container = useRef<HTMLDivElement>(null);
	const items = Object.values(tree)
		.filter(t => t.parent === 'tree')
		.sort((a, b) => a.name.localeCompare(b.name, void 0, {
			numeric: true,
			sensitivity: 'base',
		}));

	useSectionBody({ flexGrow: 2 });

	return (
		<DndProvider backend={HTML5Backend}>
			<ContextMenuWrapper mode={'root'} target={container.current!}>
				<Container tabIndex={-1} ref={container}>
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
				</Container>
			</ContextMenuWrapper>
		</DndProvider>
	);
};

const Container = styled.div`
	height: 100%;

	&:focus {
		outline: none;
	}
`;

export default TreeView;
