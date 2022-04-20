import React, { useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TypedObject } from '@beak/common/helpers/typescript';
import styled from 'styled-components';

import useSectionBody from '../../sidebar/hooks/use-section-body';
import { TreeViewItemsContext } from '../contexts/items-context';
import { TreeViewFolder, TreeViewItem, TreeViewItems } from '../types';
import FolderNode from './organisms/FolderNode';
import Node from './organisms/Node';

interface TreeViewProps {
	items: TreeViewItems;
	startingDepth?: number;
	supportDragDrop?: boolean;
}

const TreeView: React.FunctionComponent<TreeViewProps> = props => {
	const { items, startingDepth = 0, supportDragDrop } = props;
	const container = useRef<HTMLDivElement>(null);
	const formattedItems = TypedObject.values(items)
		.filter(t => t.parent === 'tree')
		.sort((a, b) => a.name.localeCompare(b.name, void 0, {
			numeric: true,
			sensitivity: 'base',
		}));

	// A tree view is probably inside a flex body, so let grooow
	useSectionBody({ flexGrow: 2 });

	return (
		<TreeViewItemsContext.Provider value={items}>
			<DndProvider backend={HTML5Backend}>
				{/* Add back root context menu wrapper */}
				<Container ref={container}>
					{formattedItems.filter(i => i.type === 'folder').map(i => (
						<FolderNode
							key={i.id}
							depth={startingDepth}
							item={i as TreeViewFolder}
						/>
					))}
					{formattedItems.filter(i => i.type !== 'folder').map(i => (
						<Node
							key={i.id}
							depth={startingDepth}
							item={i as TreeViewItem}
						/>
					))}
				</Container>

				{/* Reference */}
				<div className={'root'}>
					<div className={'folder-wrapper'}>
						<div className={'node-item'}></div>
						<div className={'folder-children'}>
							<div className={'node-wrapper'}>
								<div className={'node-item'}></div>
							</div>
							<div className={'node-wrapper'}>
								<div className={'node-item'}></div>
							</div>
						</div>
					</div>
					<div className={'node-wrapper'}>
						<div className={'node-item'}></div>
					</div>
				</div>
			</DndProvider>
		</TreeViewItemsContext.Provider>
	);
};

const Container = styled.div`
	height: 100%;

	&:focus {
		outline: none;
	}
`;

export default TreeView;
