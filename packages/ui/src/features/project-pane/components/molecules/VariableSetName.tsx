import { Box } from '@chakra-ui/react';
import ksuid from '@beak/ksuid';
import ContextMenu from '@beak/ui/components/atoms/ContextMenu';
import tabActions from '@beak/ui/features/tabs/store/actions';
import sidebarActions from '@beak/ui/store/preferences/actions';
import { actions as vgActions } from '@beak/ui/store/variable-sets';
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
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Reveal in Sidebar',
				click: () => {
					dispatch(sidebarActions.sidebarPreferenceSetSelected('variables'));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Open in Editor',
				click: () => {
					dispatch(tabActions.changeTab({
						type: 'variable_set_editor',
						payload: variableSetName,
						temporary: false,
					}));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				type: 'separator',
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Delete',
				click: () => {
					dispatch(vgActions.removeVariableSetFromDisk({
						id: variableSetName,
						withConfirmation: true,
					}));
				},
			},
		]);
	}, [variableSetName]);

	return (
		<ContextMenu menuItems={menuItems} target={targetRef.current ?? undefined}>
			<Box
				as='abbr'
				title={variableSetName}
				ref={(i: HTMLElement | null) => {
					targetRef.current = i;
				}}
				color='fg.default'
				fontSize='xs'
				fontWeight='500'
				overflow='hidden'
				textOverflow='ellipsis'
				whiteSpace='nowrap'
				textDecoration='none'
				cursor='pointer'
				transition='color .12s ease'
				_hover={{ color: 'accent.teal' }}
			>
				{variableSetName}
			</Box>
		</ContextMenu>
	);
};

export default VariableSetName;
