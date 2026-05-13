import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import ksuid from '@beak/ksuid';
import ContextMenu from '@beak/ui/components/atoms/ContextMenu';
import tabActions from '@beak/ui/features/tabs/store/actions';
import sidebarActions from '@beak/ui/store/preferences/actions';
import { actions as vgActions } from '@beak/ui/store/variable-sets';
import type { MenuItemConstructorOptions } from 'electron';
import styled from 'styled-components';

interface VariableSetNameProps {
	variableSetName: string;
}

export const VariableSetName: React.FC<VariableSetNameProps> = ({ variableSetName }) => {
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const targetRef = useRef<HTMLElement | null>(null);
	const dispatch = useDispatch();

	useEffect(() => {
		setMenuItems([{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Reveal in sidebar',
			click: () => {
				dispatch(sidebarActions.sidebarPreferenceSetSelected('variables'));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Open in editor',
			click: () => {
				dispatch(tabActions.changeTab({
					type: 'variable_set_editor',
					payload: variableSetName,
					temporary: false,
				}));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			type: 'separator',
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Delete',
			click: () => {
				dispatch(vgActions.removeVariableSetFromDisk({
					id: variableSetName,
					withConfirmation: true,
				}));
			},
		}]);
	}, [variableSetName]);

	return (
		<ContextMenu menuItems={menuItems} target={targetRef.current ?? undefined}>
			<Name
				title={variableSetName}
				ref={i => {
					targetRef.current = i;
				}}
			>
				{variableSetName}
			</Name>
		</ContextMenu>
	);
};

const Name = styled.abbr`
	color: var(--beak-colors-fg-muted);
	font-size: 12px;

	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-decoration: none;
`;

export default VariableSetName;
