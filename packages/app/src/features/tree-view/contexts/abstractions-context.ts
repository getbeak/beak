import React, { createContext } from 'react';
import { PayloadAction } from '@reduxjs/toolkit';

import { TreeViewItem } from '../types';

interface Context {
	onDrop?: (sourceNodeId: string, destinationNodeId: string) => PayloadAction<unknown>;
	onNodeClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeDoubleClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
}

export const TreeViewAbstractionsContext = createContext<Context>({ });
