import React, { useContext, useEffect, useState } from 'react';
import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import type { MenuItemConstructorOptions } from 'electron';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { TreeViewItem } from '../../types';

interface NodeContextMenuProps {
	node: TreeViewItem;
	disabled?: boolean;
	target: React.MutableRefObject<HTMLDivElement | null>;
}

const NodeContextMenu: React.FC<React.PropsWithChildren<NodeContextMenuProps>> = props => {
	const { node, target, disabled, children } = props;
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const abs = useContext(TreeViewAbstractionsContext);

	useEffect(() => {
		if (!abs.onContextMenu || disabled)
			return;

		setMenuItems(abs.onContextMenu(node));
	}, [disabled, node.id, Boolean(abs.onContextMenu)]);

	return (
		<ContextMenu menuItems={menuItems} target={target.current!}>
			{children}
		</ContextMenu>
	);
};

export default NodeContextMenu;
