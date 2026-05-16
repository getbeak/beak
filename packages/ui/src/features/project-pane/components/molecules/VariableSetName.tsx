import ContextMenu from '@beak/ui/components/atoms/ContextMenu';
import tabActions from '@beak/ui/features/tabs/store/actions';
import sidebarActions from '@beak/ui/store/preferences/actions';
import { actions as vgActions } from '@beak/ui/store/variable-sets';
import { Box } from '@chakra-ui/react';
import type { MenuItemConstructorOptions } from 'electron';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

interface VariableSetNameProps {
	variableSetName: string;
}

export const VariableSetName: React.FC<VariableSetNameProps> = ({ variableSetName }) => {
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const targetRef = useRef<HTMLElement | null>(null);
	const dispatch = useDispatch();

	useEffect(() => {
		setMenuItems([
			{
				id: 'variable-set-name-ctx:reveal',
				label: 'Reveal in Sidebar',
				click: () => {
					dispatch(sidebarActions.sidebarPreferenceSetSelected('variables'));
				},
			},
			{
				id: 'variable-set-name-ctx:open',
				label: 'Open in Editor',
				click: () => {
					dispatch(
						tabActions.changeTab({
							type: 'variable_set_editor',
							payload: variableSetName,
							temporary: false,
						}),
					);
				},
			},
			{
				id: 'variable-set-name-ctx:sep',
				type: 'separator',
			},
			{
				id: 'variable-set-name-ctx:delete',
				label: 'Delete',
				click: () => {
					dispatch(
						vgActions.removeVariableSetFromDisk({
							id: variableSetName,
							withConfirmation: true,
						}),
					);
				},
			},
		]);
	}, [variableSetName, dispatch]);

	return (
		<ContextMenu menuItems={menuItems} target={targetRef.current ?? undefined}>
			<Box
				title={variableSetName}
				ref={(i: HTMLElement | null) => {
					targetRef.current = i;
				}}
				color='fg.muted'
				fontSize='12px'
				fontWeight='500'
				overflow='hidden'
				textOverflow='ellipsis'
				whiteSpace='nowrap'
				cursor='default'
				transition='color .1s linear'
				_hover={{ color: 'fg.default' }}
			>
				{variableSetName}
			</Box>
		</ContextMenu>
	);
};

export default VariableSetName;
