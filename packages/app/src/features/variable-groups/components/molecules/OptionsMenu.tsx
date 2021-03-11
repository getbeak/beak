import { ipcDialogService } from '@beak/app/lib/ipc';
import { insertNewGroup, insertNewVariableGroup, removeGroup, removeItem, removeVg } from '@beak/app/store/variable-groups/actions';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MenuItemConstructorOptions, remote } from 'electron';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

const { Menu } = remote;

interface OptionsMenuProps {
	type: 'variable-group' | 'group' | 'item';
	id?: string;
	variableGroup: string;
}

const OptionsMenu: React.FunctionComponent<OptionsMenuProps> = ({ type, id, variableGroup }) => {
	const dispatch = useDispatch();

	function showContextMenu() {
		const menu = (() => {
			if (type === 'variable-group') {
				return Menu.buildFromTemplate([{
					label: 'Create a new variable group',
					click: () => {
						dispatch(insertNewVariableGroup({ name: 'Variable group' }));
					},
				}, {
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
				}] as MenuItemConstructorOptions[]);
			}

			if (type === 'group') {
				return Menu.buildFromTemplate([{
					label: 'Create a new group',
					click: () => {
						dispatch(insertNewGroup({ variableGroup, group: '' }));
					},
				}, {
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
					type: 'separator',
				}, {
					label: 'Shift to the left',
					enabled: false,
				}, {
					label: 'Shift to the right',
					enabled: false,
				}] as MenuItemConstructorOptions[]);
			}

			return Menu.buildFromTemplate([{
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
				type: 'separator',
			}, {
				label: 'Shift up one',
				enabled: false,
			}, {
				label: 'Shift down one',
				enabled: false,
			}] as MenuItemConstructorOptions[]);
		})();

		menu.popup();
	}

	return (
		<Wrapper onClick={() => showContextMenu()}>
			<InnerWrapper>
				<FontAwesomeIcon icon={faEllipsisV} />
			</InnerWrapper>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	cursor: pointer;
`;

const InnerWrapper = styled.div`
	transform: scale(0.8);
	padding: 2px 4px;
`;

export default OptionsMenu;
