import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import ContextMenu from '@beak/ui/components/atoms/ContextMenu';
import tabActions from '@beak/ui/features/tabs/store/actions';
import sidebarActions from '@beak/ui/store/preferences/actions';
import { actions as vgActions } from '@beak/ui/store/variable-groups';
import ksuid from '@beak/ksuid';
import type { MenuItemConstructorOptions } from 'electron';
import styled from 'styled-components';

interface VariableGroupNameProps {
	variableGroupName: string;
}

export const VariableGroupName: React.FC<VariableGroupNameProps> = ({ variableGroupName }) => {
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const targetRef = useRef<HTMLElement>();
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
					type: 'variable_group_editor',
					payload: variableGroupName,
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
				dispatch(vgActions.removeVariableGroupFromDisk({
					id: variableGroupName,
					withConfirmation: true,
				}));
			},
		}]);
	}, [variableGroupName]);

	return (
		<React.Fragment>
			<ContextMenu menuItems={menuItems} target={targetRef.current}>
				<Name
					title={variableGroupName}
					// eslint-disable-next-line no-return-assign
					ref={i => targetRef.current = i!}
				>
					{variableGroupName}
				</Name>
			</ContextMenu>
		</React.Fragment>
	);
};

const Name = styled.abbr`
	color: ${p => p.theme.ui.textMinor};
	font-size: 12px;

	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-decoration: none;
`;

export default VariableGroupName;
