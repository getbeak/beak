import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import { changeTab, makeTabPermanent } from '@beak/ui/features/tabs/store/actions';
import TreeView from '@beak/ui/features/tree-view/components/TreeView';
import type { TreeViewItem, TreeViewNodes } from '@beak/ui/features/tree-view/types';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions } from '@beak/ui/store/variable-sets';
import { removeVariableSetFromDisk } from '@beak/ui/store/variable-sets/actions';
import { renderAcceleratorDefinition } from '@beak/ui/utils/keyboard-rendering';
import type { MenuItemConstructorOptions } from 'electron';

import { Box, Flex } from '@chakra-ui/react';
import { Table } from 'lucide-react';

const VariableSets: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();
	const selectedTabId = useAppSelector(s => s.features.tabs.selectedTab);
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const variableSetKeys = TypedObject.keys(variableSets);

	const windowSession = useContext(WindowSessionContext);
	const darwin = windowSession.isDarwin();

	const tree = variableSetKeys.reduce<TreeViewNodes>((acc, k) => ({
		...acc,
		[k]: {
			id: k,
			type: 'variable-set',
			filePath: `variable-sets/${k}.json`,
			name: k,
			parent: 'variable-sets',
		},
	}), {} as TreeViewNodes);

	const empty = variableSetKeys.length === 0;

	function generateContextMenu(node: TreeViewItem): MenuItemConstructorOptions[] {
		return [{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'New variable group',
			click: () => {
				dispatch(actions.createNewVariableSet({ }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: `Reveal in ${darwin ? 'Finder' : 'Explorer'}`,
			enabled: node.id !== 'root',
			click: () => {
				ipcExplorerService.revealFile(node.filePath);
			},
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{ id: ksuid.generate('ctxmenuitem').toString(), label: 'Copy', enabled: false },
		{ id: ksuid.generate('ctxmenuitem').toString(), label: 'Cut', enabled: false },
		{ id: ksuid.generate('ctxmenuitem').toString(), label: 'Paste', enabled: false },

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy path',
			enabled: node.id !== 'root',
			click: () => ipcExplorerService.copyFullNodePath(node.filePath),
		},
		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy relative path',
			enabled: node.id !== 'root',
			click: () => navigator.clipboard.writeText(node.filePath),
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Rename',
			accelerator: renderAcceleratorDefinition('tree-view.node.rename'),
			enabled: node.id !== 'root',
			click: () => {
				if (node.id === 'root')
					return;

				dispatch(actions.renameStarted({ id: node.id }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Delete',
			accelerator: renderAcceleratorDefinition('tree-view.node.delete'),
			enabled: node.id !== 'root',
			click: () => {
				dispatch(actions.removeVariableSetFromDisk({ id: node.id, withConfirmation: true }));
			},
		}];
	}

	function handleNodeClick(_event: React.MouseEvent<HTMLDivElement>, node: TreeViewItem) {
		if (node.type === 'folder')
			return;

		dispatch(changeTab({
			type: 'variable_set_editor',
			payload: node.id,
			temporary: true,
		}));
	}

	function handleNodeDoubleClick(_event: React.MouseEvent<HTMLDivElement>, node: TreeViewItem) {
		if (node.type === 'folder')
			return;

		dispatch(makeTabPermanent(node.id));
	}

	function handleNodeKeyDown(event: React.KeyboardEvent<HTMLDivElement>, node: TreeViewItem) {
		switch (true) {
			case checkShortcut('variable-sets.variable-set.open', event) && node.type !== 'folder':
				dispatch(changeTab({ type: 'variable_set_editor', payload: node.id, temporary: false }));
				break;

			case checkShortcut('variable-sets.variable-set.delete', event) && node.type !== 'folder':
				dispatch(removeVariableSetFromDisk({ id: node.id, withConfirmation: true }));
				break;

			default: return;
		}

		event.preventDefault();
	}

	return (
		<React.Fragment>
			{empty && (
				<Flex direction='column' align='center' justify='center' gap='2.5' py='5' px='3' textAlign='center'>
					<Flex
						align='center'
						justify='center'
						w='40px'
						h='40px'
						borderRadius='lg'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
						color='accent.pink'
						boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
					>
						<Table size={18} strokeWidth={2} />
					</Flex>
					<Box fontSize='xs' fontWeight='600' color='fg.default'>{'No variable sets yet'}</Box>
					<Box fontSize='10px' color='fg.subtle' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
						{'Right-click to add one'}
					</Box>
				</Flex>
			)}

			<TreeView
				tree={tree}
				activeNodeId={selectedTabId}
				focusedNodeId={selectedTabId}
				allowRootContextMenu
				rootParentName={'variable-sets'}

				renameSelector={(_node, state) => state.global.variableSets.activeRename}
				onRenameStarted={node => dispatch(actions.renameStarted({ id: node.id }))}
				onRenameEnded={node => dispatch(actions.renameCancelled({ id: node.id }))}
				onRenameUpdated={(node, name) => dispatch(actions.renameUpdated({ id: node.id, name }))}
				onRenameSubmitted={node => dispatch(actions.renameSubmitted({ id: node.id }))}

				onContextMenu={generateContextMenu}
				onNodeClick={handleNodeClick}
				onNodeDoubleClick={handleNodeDoubleClick}
				onNodeKeyDown={handleNodeKeyDown}
			/>
		</React.Fragment>
	);
};

export default VariableSets;
