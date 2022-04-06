import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { changeTab } from '@beak/app/features/tabs/store/actions';
import { ipcDialogService, ipcExplorerService } from '@beak/app/lib/ipc';
import { actions } from '@beak/app/store/variable-groups';
import ksuid from '@cuvva/ksuid';
import type { MenuItemConstructorOptions } from 'electron';
import path from 'path-browserify';

interface ContextMenuWrapperProps {
	variableGroupName: string;
	target: HTMLElement | undefined;
}

const ContextMenuWrapper: React.FunctionComponent<ContextMenuWrapperProps> = props => {
	const dispatch = useDispatch();
	const { variableGroupName, target, children } = props;

	const node = useSelector(s => s.global.variableGroups.variableGroups[variableGroupName]);
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const windowSession = useContext(WindowSessionContext);
	const darwin = windowSession.isDarwin();

	useEffect(() => {
		if (!node)
			return;

		const relativeVariableGroupPath = convertToRelativePath(variableGroupName);

		setMenuItems([{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'New variable group',
			click: () => {
				dispatch(actions.insertNewVariableGroup({ name: 'New variable group' }));
				dispatch(changeTab({ type: 'variable_group_editor', payload: 'New variable group', temporary: false }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Duplicate variable group',
			enabled: false,
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: `Reveal in ${darwin ? 'Finder' : 'Explorer'}`,
			click: () => {
				ipcExplorerService.revealFile(relativeVariableGroupPath);
			},
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy path',
			click: () => ipcExplorerService.copyFullNodePath(relativeVariableGroupPath),
		},
		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy relative path',
			click: () => navigator.clipboard.writeText(relativeVariableGroupPath),
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Rename',
			accelerator: darwin ? 'Return' : 'F2',
			click: () => {
				dispatch(actions.renameStarted({ variableGroupName }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Delete',
			click: async () => {
				const result = await ipcDialogService.showMessageBox({
					title: 'Are you sure?',
					message: `Are you sure you want to remove ${variableGroupName}?`,
					detail: 'This action cannot be undone from inside Beak',
					type: 'warning',
					buttons: ['Remove', 'Cancel'],
					defaultId: 1,
					cancelId: 1,
				});

				if (result.response === 1)
					return;

				dispatch(actions.removeVg(variableGroupName));
			},
		}]);
	}, [variableGroupName, node]);

	return (
		<ContextMenu menuItems={menuItems} target={target}>
			{children}
		</ContextMenu>
	);
};

function convertToRelativePath(variableGroupName: string) {
	return path.join('variable-groups', `${variableGroupName}.json`);
}

export default ContextMenuWrapper;
