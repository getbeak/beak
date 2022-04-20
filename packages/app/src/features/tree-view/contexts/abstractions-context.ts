import React, { createContext } from 'react';
import { PayloadAction } from '@reduxjs/toolkit';
import type { MenuItemConstructorOptions } from 'electron';

import { TreeViewItem } from '../types';

interface Context {
	onContextMenu?: (node: TreeViewItem) => MenuItemConstructorOptions[];
	onDrop?: (sourceNodeId: string, destinationNodeId: string) => PayloadAction<unknown>;
	onNodeClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeDoubleClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
}

export const TreeViewAbstractionsContext = createContext<Context>({ });
