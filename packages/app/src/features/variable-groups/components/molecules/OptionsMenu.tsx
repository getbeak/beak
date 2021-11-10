import { ipcContextMenuService, ipcDialogService } from '@beak/app/lib/ipc';
import {
	insertNewGroup,
	insertNewVariableGroup,
	removeGroup,
	removeItem,
	removeVg,
} from '@beak/app/store/variable-groups/actions';
import ksuid from '@cuvva/ksuid';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { MenuItemConstructorOptions } from 'electron';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

interface OptionsMenuProps {
	type: 'variable-group' | 'group' | 'item';
	id?: string;
	inTab?: boolean;
	variableGroup: string;
}

const OptionsMenu: React.FunctionComponent<OptionsMenuProps> = ({ type, id, inTab, variableGroup }) => {
	const dispatch = useDispatch();

	async function showContextMenu(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
		event.stopPropagation();
		event.preventDefault();

		const menuItems = (() => {
			if (type === 'variable-group') {
				return [{
					id: ksuid.generate('ctxmenuitem').toString(),
					label: 'Create a new variable group',
					click: () => {
						dispatch(insertNewVariableGroup({ name: 'Variable group' }));
					},
				}, {
					id: ksuid.generate('ctxmenuitem').toString(),
					label: 'Remove this variable group',
					click: async () => {
						const result = await ipcDialogService.showMessageBox({
							title: 'Are you sure?',
							message: 'Are you sure you want to remove this variable group?',
							detail: 'This action cannot be undone from inside Beak',
							type: 'warning',
							buttons: ['Remove', 'Cancel'],
							defaultId: 1,
							cancelId: 1,
						});

						if (result.response === 1)
							return;

						dispatch(removeVg(variableGroup));
					},
				}] as MenuItemConstructorOptions[];
			}

			if (type === 'group') {
				return [{
					id: ksuid.generate('ctxmenuitem').toString(),
					label: 'Create a new group',
					click: () => {
						dispatch(insertNewGroup({ variableGroup, group: '' }));
					},
				}, {
					id: ksuid.generate('ctxmenuitem').toString(),
					label: 'Remove this group',
					click: async () => {
						const result = await ipcDialogService.showMessageBox({
							title: 'Are you sure?',
							message: 'Are you sure you want to remove this variable group?',
							detail: 'This action cannot be undone from inside Beak',
							type: 'warning',
							buttons: ['Remove', 'Cancel'],
							defaultId: 1,
							cancelId: 1,
						});

						if (result.response === 1)
							return;

						dispatch(removeGroup({ variableGroup, id: id! }));
					},
				}, {
					id: ksuid.generate('ctxmenuitem').toString(),
					type: 'separator',
				}, {
					id: ksuid.generate('ctxmenuitem').toString(),
					label: 'Shift to the left',
					enabled: false,
				}, {
					id: ksuid.generate('ctxmenuitem').toString(),
					label: 'Shift to the right',
					enabled: false,
				}] as MenuItemConstructorOptions[];
			}

			return [{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Remove this item',
				click: async () => {
					const result = await ipcDialogService.showMessageBox({
						title: 'Are you sure?',
						message: 'Are you sure you want to remove this variable group item?',
						detail: 'This action cannot be undone from inside Beak',
						type: 'warning',
						buttons: ['Remove', 'Cancel'],
						defaultId: 1,
						cancelId: 1,
					});

					if (result.response === 1)
						return;

					dispatch(removeItem({ variableGroup, id: id! }));
				},
			}, {
				id: ksuid.generate('ctxmenuitem').toString(),
				type: 'separator',
			}, {
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Shift up one',
				enabled: false,
			}, {
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Shift down one',
				enabled: false,
			}] as MenuItemConstructorOptions[];
		})();

		const id = ksuid.generate('ctxmenu').toString();

		ipcContextMenuService.registerItemClickEvent(async (_event, payload) => {
			if (payload.id !== id)
				return;

			const menuItem = menuItems.find(m => m.id === payload.menuItemId);

			// @ts-expect-error
			menuItem?.click?.();
		});

		await ipcContextMenuService.openContextMenu({
			id,
			menuItems: menuItems.map(m => ({
				id: m.id!,
				label: m.label,
				enabled: m.enabled,
				type: m.type,
			})),
		});
	}

	return (
		<Wrapper onClick={e => showContextMenu(e)}>
			<InnerWrapper inTab={inTab}>
				<FontAwesomeIcon icon={faEllipsisV} />
			</InnerWrapper>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	cursor: pointer;
	display: inline-block;
`;

const InnerWrapper = styled.div<{ inTab?: boolean }>`
	transform: scale(0.8);
	padding: ${p => p.inTab ? '0 4px' : '2px 4px'};
`;

export default OptionsMenu;
