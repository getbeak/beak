import type { ApplicationState } from '@beak/ui/store';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MenuItemConstructorOptions } from 'electron';
import type React from 'react';
import { createContext } from 'react';

import type { TreeViewItem } from '../types';

/**
 * Imperative handles surfaced to consumers (mostly the context-menu
 * generator) so menu items can drive the tree machine without needing
 * direct access to the Zag api.
 */
export interface TreeCommands {
	/** Expand every branch in the tree. */
	expandAll: () => void;
	/** Collapse every branch in the tree. */
	collapseAll: () => void;
	/** Expand `nodeId` and every descendant folder under it. */
	expandDescendantsOf: (nodeId: string) => void;
	/** Collapse `nodeId` and every descendant folder under it. */
	collapseDescendantsOf: (nodeId: string) => void;
}

interface Context {
	/**
	 * The node id whose tab is currently active. Drives the accent-pink
	 * highlight on the matching row; intentionally distinct from the tree
	 * machine's `selectedValue` (selection moves with the keyboard;
	 * activeNodeId reflects which file the user is currently viewing).
	 */
	activeNodeId?: string;

	/**
	 * Imperative commands the TreeView injects so consumer-built context
	 * menus can drive the tree (expand all, collapse all, ...) without
	 * threading the Zag api through props.
	 */
	commands?: TreeCommands;

	nodeFlairRenderers?: {
		[k: string]: (node: TreeViewItem) => React.ReactElement;
	};

	renameSelector?: (node: TreeViewItem, state: ApplicationState) => unknown;
	onRenameStarted?: (node: TreeViewItem) => void;
	onRenameUpdated?: (node: TreeViewItem, name: string) => void;
	onRenameSubmitted?: (node: TreeViewItem) => void;
	onRenameEnded?: (node: TreeViewItem) => void;

	onContextMenu?: (node: TreeViewItem, commands?: TreeCommands) => MenuItemConstructorOptions[];
	onDrop?: (sourceNodeId: string, destinationNodeId: string) => PayloadAction<unknown>;
	onNodeClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeDoubleClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, node: TreeViewItem) => void;
	onNodeKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>, node: TreeViewItem) => void;
}

export const TreeViewAbstractionsContext = createContext<Context>({});
