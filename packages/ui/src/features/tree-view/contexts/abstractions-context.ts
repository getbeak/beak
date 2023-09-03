import React, { createContext } from 'react';
import { ApplicationState } from '@beak/ui/store';
import { PayloadAction } from '@reduxjs/toolkit';
import type { MenuItemConstructorOptions } from 'electron';

import { TreeViewItem } from '../types';

interface Context {
	nodeFlairRenderers?: {
		[k: string]: (node: TreeViewItem) => React.ReactElement;
	};

	renameSelector?: (node: TreeViewItem, state: ApplicationState) => unknown;
	onRenameStarted?: (node: TreeViewItem) => void;
	onRenameUpdated?: (node: TreeViewItem, name: string) => void;
	onRenameSubmitted?: (node: TreeViewItem) => void;
	onRenameEnded?: (node: TreeViewItem) => void;

	onContextMenu?: (node: TreeViewItem) => MenuItemConstructorOptions[];
	onDrop?: (sourceNodeId: string, destinationNodeId: string) => PayloadAction<unknown>;
	onNodeClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeDoubleClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>, node: TreeViewItem) => void;
}

export const TreeViewAbstractionsContext = createContext<Context>({ });
