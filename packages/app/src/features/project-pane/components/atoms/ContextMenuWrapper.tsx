import React, { useState } from 'react';
import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import type { MenuItemConstructorOptions } from 'electron';

interface ContextMenuWrapperProps {
	nodeId?: string;
	mode: 'request' | 'folder' | 'root';
	target: HTMLElement | undefined;
}

const ContextMenuWrapper: React.FunctionComponent<ContextMenuWrapperProps> = props => {
	const { target, children } = props;
	const [menuItems] = useState<MenuItemConstructorOptions[]>([]);

	return (
		<ContextMenu menuItems={menuItems} target={target}>
			{children}
		</ContextMenu>
	);
};

export default ContextMenuWrapper;
